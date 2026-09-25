import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { subscriptionRepo, crewProfileRepo, requesterFromSession } from '@/lib/repo'


export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requester = requesterFromSession(session)

    // Get user's current subscription
    const subscription = await subscriptionRepo.findByUserId(session.user.id, requester)

    // Get crew profile for subscription tier
    const crewProfileRow = await crewProfileRepo.findByUserId(session.user.id, requester)
    const crewProfile = crewProfileRow
      ? { subscriptionTier: crewProfileRow.subscriptionTier, trialEnds: crewProfileRow.trialEnds }
      : null

    return NextResponse.json({
      subscription,
      crewProfile
    })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, planId } = await request.json()

    const requester = requesterFromSession(session)

    if (action === 'cancel') {
      // Cancel subscription
      const subscription = await subscriptionRepo.findByUserId(session.user.id, requester)

      if (!subscription) {
        return NextResponse.json(
          { error: 'No active subscription found' },
          { status: 404 }
        )
      }

      // Update subscription status
      await subscriptionRepo.update(subscription.id, { status: 'CANCELED' }, requester)

      // Optionally update crew profile tier to FREE_TRIAL
      // (Prisma's update-by-unique threw — 500 — when no crew profile existed)
      const updatedCrew = await crewProfileRepo.updateByUserId(
        session.user.id,
        {
          subscriptionTier: 'FREE_TRIAL',
          trialEnds: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days grace period
        },
        requester
      )
      if (!updatedCrew) {
        throw new Error('Crew profile not found')
      }

      return NextResponse.json({
        success: true,
        message: 'Subscription canceled successfully'
      })
    }

    if (action === 'upgrade' && planId) {
      // Check if plan exists
      const plan = await subscriptionRepo.findPlanById(planId)

      if (!plan) {
        return NextResponse.json(
          { error: 'Plan not found' },
          { status: 404 }
        )
      }

      // Update or create subscription
      const existingSubscription = await subscriptionRepo.findByUserId(session.user.id, requester)

      if (existingSubscription) {
        await subscriptionRepo.update(
          existingSubscription.id,
          {
            planId: plan.id,
            status: 'ACTIVE',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          },
          requester
        )
      } else {
        await subscriptionRepo.create(
          session.user.id,
          {
            planId: plan.id,
            status: 'ACTIVE',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          },
          requester
        )
      }

      // Update crew profile subscription tier
      const subscriptionTier = plan.name === 'Pro Profile' ? 'PRO' : 'BASIC'

      // (Prisma's update-by-unique threw — 500 — when no crew profile existed)
      const updatedCrew = await crewProfileRepo.updateByUserId(
        session.user.id,
        { subscriptionTier },
        requester
      )
      if (!updatedCrew) {
        throw new Error('Crew profile not found')
      }

      return NextResponse.json({
        success: true,
        message: 'Subscription upgraded successfully'
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error managing subscription:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
