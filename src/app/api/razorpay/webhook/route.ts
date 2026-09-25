import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { subscriptionRepo, crewProfileRepo, SYSTEM_REQUESTER } from '@/lib/repo'
import { webhookEventsRepo } from '@/lib/payments/webhook-events'
import { getPaymentProvider } from '@/lib/payments'
import { requireEnv } from '@/lib/env'

// Razorpay subscription lifecycle events we persist. Anything else is
// acknowledged but ignored.
type RazorpaySubscriptionEvent =
  | 'subscription.activated'
  | 'subscription.charged'
  | 'subscription.cancelled'
  | 'subscription.halted'
  | 'subscription.completed'

interface RazorpayEntity {
  id?: string
  notes?: Record<string, string | undefined>
  current_start?: number
  current_end?: number
  payment_id?: string
}

interface RazorpayWebhookPayload {
  event?: string
  payload?: {
    subscription?: { entity?: RazorpayEntity }
    payment?: { entity?: RazorpayEntity }
  }
}

// Resolve a subscription row by Razorpay subscription id, falling back to
// the userId the checkout stored in the subscription notes.
async function findRow(razorpaySubscriptionId: string, notes: Record<string, string | undefined> | undefined) {
  const byId = await subscriptionRepo.findByRazorpaySubscriptionId(razorpaySubscriptionId)
  if (byId) return byId
  const userId = notes?.userId
  if (!userId) return null
  return subscriptionRepo.findByUserId(userId, SYSTEM_REQUESTER)
}

export async function POST(request: NextRequest) {
  // Raw body as text: the Razorpay HMAC signature covers the exact bytes.
  const body = await request.text()
  const signature = request.headers.get('x-razorpay-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature provided' }, { status: 400 })
  }

  if (!requireEnv(process.env.RAZORPAY_WEBHOOK_SECRET, 'RAZORPAY_WEBHOOK_SECRET')) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let payload: RazorpayWebhookPayload
  try {
    payload = getPaymentProvider('razorpay').verifyWebhook(body, signature) as RazorpayWebhookPayload
  } catch (err) {
    console.error('Razorpay webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const eventType = payload.event
  if (!eventType) {
    return NextResponse.json({ error: 'Missing event type' }, { status: 400 })
  }

  // Idempotency: Razorpay retries failed deliveries. It sends an event id
  // header; when absent, the raw-body hash is a stable stand-in.
  const eventId = request.headers.get('x-razorpay-event-id') ?? createHash('sha256').update(body).digest('hex')
  const isFirstDelivery = await webhookEventsRepo.claim('razorpay', eventId, eventType)
  if (!isFirstDelivery) {
    return NextResponse.json({ received: true, duplicate: true })
  }

  const entity = payload.payload?.subscription?.entity
  const payment = payload.payload?.payment?.entity
  if (!entity?.id) {
    return NextResponse.json({ received: true, ignored: 'no subscription id' })
  }

  try {
    const row = await findRow(entity.id, entity.notes)

    switch (eventType as RazorpaySubscriptionEvent) {
      case 'subscription.activated': {
        const periodStart = typeof entity.current_start === 'number' ? new Date(entity.current_start * 1000) : new Date()
        const periodEnd = typeof entity.current_end === 'number'
          ? new Date(entity.current_end * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

        if (row) {
          await subscriptionRepo.update(row.id, {
            status: 'ACTIVE',
            razorpaySubscriptionId: entity.id,
            razorpayPaymentId: payment?.id ?? undefined,
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
          }, SYSTEM_REQUESTER)
        } else {
          // New subscription with no prior row: the checkout route pre-creates
          // one, so landing here means the notes lookup failed — log for
          // investigation rather than guessing a plan.
          console.error('subscription.activated: no subscription row found for', entity.id)
          break
        }

        const tier = row.plan?.name === 'Pro Profile' ? 'PRO' : 'BASIC'
        const updatedCrew = await crewProfileRepo.updateByUserId(row.userId, { subscriptionTier: tier }, SYSTEM_REQUESTER)
        if (!updatedCrew) console.warn('subscription.activated: CrewProfile not found for user, skipping tier update:', row.userId)
        break
      }

      case 'subscription.charged': {
        // Renewal payment: roll the period forward and stay ACTIVE.
        if (!row) break
        const periodStart = typeof entity.current_start === 'number' ? new Date(entity.current_start * 1000) : undefined
        const periodEnd = typeof entity.current_end === 'number' ? new Date(entity.current_end * 1000) : undefined
        await subscriptionRepo.update(row.id, {
          status: 'ACTIVE',
          razorpayPaymentId: payment?.id ?? undefined,
          ...(periodStart ? { currentPeriodStart: periodStart } : {}),
          ...(periodEnd ? { currentPeriodEnd: periodEnd } : {}),
        }, SYSTEM_REQUESTER)
        break
      }

      case 'subscription.cancelled':
      case 'subscription.completed': {
        if (!row) break
        await subscriptionRepo.update(row.id, { status: 'CANCELED' }, SYSTEM_REQUESTER)
        const updatedCrew = await crewProfileRepo.updateByUserId(row.userId, {
          subscriptionTier: 'FREE_TRIAL',
          trialEnds: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days grace
        }, SYSTEM_REQUESTER)
        if (!updatedCrew) console.warn(`${eventType}: CrewProfile not found for user, skipping tier update:`, row.userId)
        break
      }

      case 'subscription.halted': {
        // Payment failures suspended the subscription.
        if (!row) break
        await subscriptionRepo.update(row.id, { status: 'UNPAID' }, SYSTEM_REQUESTER)
        break
      }

      default:
        break
    }
  } catch (error) {
    // Log and acknowledge: matching the Stripe webhook's no-retry policy,
    // duplicate deliveries are already suppressed by the event claim.
    console.error('Razorpay webhook handler error:', error)
  }

  return NextResponse.json({ received: true })
}
