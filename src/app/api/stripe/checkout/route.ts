import { env } from '@/lib/env'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { subscriptionRepo, requesterFromSession } from '@/lib/repo'
import { getPaymentProvider } from '@/lib/payments'


export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId } = await request.json()

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    const requester = requesterFromSession(session)

    // Get the subscription plan
    const plan = await subscriptionRepo.findPlanById(planId)

    // Prevent creating a new checkout if user already has this plan active
    const existing = await subscriptionRepo.findByUserId(session.user.id, requester)

    if (existing && existing.status === 'ACTIVE' && existing.planId === planId) {
      return NextResponse.json(
        { error: 'You already have this plan active' },
        { status: 400 }
      )
    }

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    if (!plan.stripePriceId) {
      return NextResponse.json(
        { error: 'This plan is not configured for Stripe payments' },
        { status: 400 }
      )
    }

    // Create or get Stripe customer, then the checkout session, via the
    // payments layer
    const baseUrl = env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const checkout = await getPaymentProvider('stripe').createCheckout({
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name ?? undefined,
      planId: plan.id,
      providerPlanId: plan.stripePriceId,
      successUrl: `${baseUrl}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/subscription-plans?canceled=true`,
    })

    return NextResponse.json({
      sessionId: checkout.checkoutId,
      url: checkout.url
    })
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
