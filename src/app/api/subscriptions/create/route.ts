import { env } from '@/lib/env'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { subscriptionRepo, userRepo, crewProfileRepo, requesterFromSession } from '@/lib/repo'
import { getPaymentProvider } from '@/lib/payments'


export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'CREW') {
      return NextResponse.json({ error: 'Subscriptions are only available to crew members' }, { status: 403 })
    }

    const { planId } = await request.json()

    const requester = requesterFromSession(session)

    const plan = await subscriptionRepo.findPlanById(planId)

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Prevent duplicate active subscription for same plan
    const existing = await subscriptionRepo.findByUserId(session.user.id, requester)

    if (existing && existing.status === 'ACTIVE' && existing.planId === planId) {
      return NextResponse.json({ error: 'You already have this plan active' }, { status: 400 })
    }

    // If Razorpay is not configured, return a graceful error
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 503 })
    }

    // Create actual Razorpay subscription with user info in notes via the
    // payments layer
    const user = await userRepo.findByIdRaw(session.user.id)
    const checkout = await getPaymentProvider('razorpay').createCheckout({
      userId: session.user.id,
      email: user?.email || session.user.email,
      name: user?.name || 'Unknown',
      planId: plan.id,
      providerPlanId: plan.id, // Razorpay plan ids come from the same plans table
      successUrl: '',
      cancelUrl: '',
    })

    // Get the subscription ID
    const subscriptionId = checkout.checkoutId

    // Record the checkout as UNPAID (pending). It becomes ACTIVE, and the crew
    // tier is upgraded, only when Razorpay's signed `subscription.activated`
    // webhook confirms payment (api/razorpay/webhook). Granting access here
    // would hand out paid tiers to anyone who merely starts a checkout.
    const crewProfile = await crewProfileRepo.findByUserId(session.user.id, requester)
    if (!crewProfile) {
      throw new Error('Crew profile not found')
    }

    await subscriptionRepo.create(session.user.id, {
      planId: plan.id,
      status: 'UNPAID',
      razorpaySubscriptionId: subscriptionId,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }, requester)

    return NextResponse.json({
      success: true,
      subscription: checkout.raw,
      key: checkout.publicKey
    })
  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
