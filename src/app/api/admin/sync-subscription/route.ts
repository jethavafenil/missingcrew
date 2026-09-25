import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { subscriptionRepo, crewProfileRepo, requesterFromSession } from '@/lib/repo'
import { getStripe } from '@/lib/stripe'


export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stripe = getStripe()

    // Get customer from Stripe
    const customers = await stripe.customers.list({
      email: session.user.email,
      limit: 1
    })

    if (customers.data.length === 0) {
      return NextResponse.json({ 
        error: 'No Stripe customer found',
        message: 'You need to complete a subscription purchase first'
      }, { status: 404 })
    }

    const customer = customers.data[0]

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 10
    })

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ 
        error: 'No active subscriptions found',
        message: 'Complete a subscription purchase to activate your plan'
      }, { status: 404 })
    }

    // Get the most recent Pro subscription, or any subscription
    let selectedSub = subscriptions.data.find(s => 
      s.items.data[0].price.unit_amount === 39900 // Pro = ₹399
    )
    
    if (!selectedSub) {
      selectedSub = subscriptions.data[0] // Use most recent
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscriptionData = selectedSub as any
    const priceId = subscriptionData.items.data[0].price.id

    // Find the plan in database
    const plan = await subscriptionRepo.findPlanByStripePriceId(priceId)

    if (!plan) {
      return NextResponse.json({ 
        error: 'Plan not found',
        message: `No plan found for Price ID: ${priceId}`
      }, { status: 404 })
    }

    // Check if subscription already exists
    const requester = requesterFromSession(session)
    const existingSub = await subscriptionRepo.findByUserId(session.user.id, requester)

    // Parse dates safely
    const currentPeriodStart = subscriptionData.current_period_start
      ? new Date(subscriptionData.current_period_start * 1000)
      : new Date()

    const currentPeriodEnd = subscriptionData.current_period_end
      ? new Date(subscriptionData.current_period_end * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    if (existingSub) {
      // Update existing
      await subscriptionRepo.update(
        existingSub.id,
        {
          planId: plan.id,
          stripeCustomerId: customer.id,
          stripeSubscriptionId: selectedSub.id,
          stripePriceId: priceId,
          status: 'ACTIVE',
          currentPeriodStart,
          currentPeriodEnd,
        },
        requester
      )
    } else {
      // Create new
      await subscriptionRepo.create(
        session.user.id,
        {
          planId: plan.id,
          stripeCustomerId: customer.id,
          stripeSubscriptionId: selectedSub.id,
          stripePriceId: priceId,
          status: 'ACTIVE',
          currentPeriodStart,
          currentPeriodEnd,
        },
        requester
      )
    }

    // Update crew profile tier
    const tier = plan.name === 'Pro Profile' ? 'PRO' : 'BASIC'
    // (Prisma's update-by-unique threw — 500 — when no crew profile existed)
    const updatedCrew = await crewProfileRepo.updateByUserId(
      session.user.id,
      { subscriptionTier: tier },
      requester
    )
    if (!updatedCrew) {
      throw new Error('Crew profile not found')
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription synced successfully',
      plan: plan.name,
      tier: tier,
      subscriptionId: selectedSub.id
    })

  } catch (error) {
    console.error('Error syncing subscription:', error)
    return NextResponse.json(
      { error: 'Failed to sync subscription', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
