import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { subscriptionRepo, SYSTEM_REQUESTER } from '@/lib/repo'
import { requireRole } from '@/lib/api/auth'

export async function GET(request: NextRequest) {
  try {
    await requireRole('ADMIN')
    const sessionId = request.nextUrl.searchParams.get('session_id')
    
    if (!sessionId) {
      return NextResponse.json({ error: 'session_id required' }, { status: 400 })
    }

    const stripe = getStripe()
    
    // Get the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    // Get the subscription if it exists
    let subscription = null
    if (session.subscription) {
      subscription = await stripe.subscriptions.retrieve(
        session.subscription as string,
        { expand: ['items.data.price'] }
      )
    }

    // Get customer details
    let customer = null
    if (session.customer) {
      customer = await stripe.customers.retrieve(session.customer as string)
    }

    // Check database for subscription
    let dbSubscription = null
    if (customer && 'metadata' in customer && customer.metadata?.userId) {
      dbSubscription = await subscriptionRepo.findByUserId(customer.metadata.userId, SYSTEM_REQUESTER)
    }

    return NextResponse.json({
      session: {
        id: session.id,
        status: session.status,
        payment_status: session.payment_status,
        customer: session.customer,
        subscription: session.subscription,
        mode: session.mode
      },
      customer: customer ? {
        id: 'id' in customer ? customer.id : null,
        email: 'email' in customer ? customer.email : null,
        metadata: 'metadata' in customer ? customer.metadata : null
      } : null,
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        current_period_start: (subscription as any).current_period_start,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        current_period_end: (subscription as any).current_period_end,
        items: subscription.items.data.map(item => ({
          price_id: item.price.id,
          amount: item.price.unit_amount
        }))
      } : null,
      database: {
        subscription: dbSubscription ? {
          id: dbSubscription.id,
          status: dbSubscription.status,
          planName: dbSubscription.plan?.name ?? null,
          stripePriceId: dbSubscription.stripePriceId
        } : null
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { error: 'Debug failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
