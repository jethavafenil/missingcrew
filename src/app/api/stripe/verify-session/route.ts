import { NextRequest, NextResponse } from 'next/server'
import { subscriptionRepo, userRepo, crewProfileRepo, SYSTEM_REQUESTER } from '@/lib/repo'
import { getStripe } from '@/lib/stripe'
import { persistProviderSubscription } from '@/lib/payments'
import Stripe from 'stripe'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/body'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const { session } = await requireAuth()
    const { sessionId } = await parseBody(request, z.object({ sessionId: z.string().min(8).max(255) }))

    const stripe = getStripe()

    // Retrieve the Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)

    if (!checkoutSession) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 404 })
    }
    if (checkoutSession.metadata?.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Ensure payment completed
    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    // Resolve user by Stripe customer metadata or email
    const customerId = checkoutSession.customer as string | null
    if (!customerId) {
      return NextResponse.json({ error: 'Missing customer on session' }, { status: 400 })
    }

    const customer = await stripe.customers.retrieve(customerId)
    let userId = (customer as Stripe.Customer).metadata?.userId as string | undefined
    if (!userId) {
      const customerEmail = (customer as Stripe.Customer).email
      if (customerEmail) {
        const user = await userRepo.findByEmail(customerEmail, SYSTEM_REQUESTER)
        if (user) userId = user.id
      }
    }
    if (!userId) {
      return NextResponse.json({ error: 'User not found for Stripe customer' }, { status: 404 })
    }

    // Get the subscription from Stripe
    if (checkoutSession.subscription) {
      const subscription = await stripe.subscriptions.retrieve(
        checkoutSession.subscription as string,
        { expand: ['items.data.price'] }
      )

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subscriptionData = subscription as any
      const item = subscriptionData.items.data[0]
      const priceId = item.price.id as string
      const unitAmount = item.price.unit_amount
      const amount = typeof unitAmount === 'number' ? Math.round(unitAmount / 100) : null

      // Find the plan by Stripe price ID; fallback by amount if needed
      let plan = await subscriptionRepo.findPlanByStripePriceId(priceId)
      if (!plan && amount !== null) {
        plan = await subscriptionRepo.findPlanByPrice(amount)
      }
      if (!plan) {
        return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
      }

      // Safe date conversions
      const toDate = (v: unknown, fallbackMs = 0) => {
        if (typeof v === 'number') {
          const d = new Date(v * 1000)
          return isNaN(d.getTime()) ? new Date(Date.now() + fallbackMs) : d
        }
        if (typeof v === 'string' || v instanceof Date) {
          const d = new Date(v as any)
          return isNaN(d.getTime()) ? new Date(Date.now() + fallbackMs) : d
        }
        return new Date(Date.now() + fallbackMs)
      }

      // Create or update subscription in database through the payments
      // layer (the update path leaves any existing Razorpay identifiers
      // untouched, matching the Prisma upsert)
      await persistProviderSubscription({
        userId,
        planId: plan.id,
        status: 'ACTIVE',
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionData.id,
        stripePriceId: priceId,
        currentPeriodStart: toDate(subscriptionData.current_period_start),
        currentPeriodEnd: toDate(subscriptionData.current_period_end, 30 * 24 * 60 * 60 * 1000),
      }, SYSTEM_REQUESTER)

      // Update crew profile tier (guard if profile missing)
      const subscriptionTier = plan.name === 'Pro Profile' ? 'PRO' : 'BASIC'
      const updatedCrew = await crewProfileRepo.updateByUserId(userId, { subscriptionTier }, SYSTEM_REQUESTER)
      if (!updatedCrew) {
        console.warn('verify-session: CrewProfile not found for user, skipping tier update:', userId)
      }

      return NextResponse.json({
        success: true,
        message: 'Subscription updated successfully',
        tier: subscriptionTier,
      })
    }

    return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
  } catch (error) {
    console.error('Error verifying Stripe session:', error)
    return NextResponse.json(
      { error: 'Failed to verify session' },
      { status: 500 }
    )
  }
}
