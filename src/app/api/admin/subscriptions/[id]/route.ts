import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { subscriptionRepo, crewProfileRepo, assertAdmin, requesterFromSession } from '@/lib/repo'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requester = assertAdmin(requesterFromSession(session))
    const resolvedParams = await params
    const subscriptionId = resolvedParams.id
    const { action } = await request.json()

    // Find the subscription
    const subscription = await subscriptionRepo.findById(subscriptionId, requester)

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    let updatedSubscription

    if (action === 'cancel') {
      // Cancel subscription
      updatedSubscription = await subscriptionRepo.update(
        subscriptionId,
        {
          status: 'CANCELED',
          currentPeriodEnd: new Date() // End immediately
        },
        requester
      )

      // Update crew profile subscription tier to FREE_TRIAL
      // (Prisma's update-by-unique threw — 500 — when no crew profile existed)
      const updatedCrew = await crewProfileRepo.updateByUserId(
        subscription.userId,
        { subscriptionTier: 'FREE_TRIAL' },
        requester
      )
      if (!updatedCrew) {
        throw new Error('Crew profile not found')
      }
    } else if (action === 'reactivate') {
      // Reactivate subscription
      const now = new Date()
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 1) // Add 1 month

      updatedSubscription = await subscriptionRepo.update(
        subscriptionId,
        {
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: endDate
        },
        requester
      )

      // Update crew profile subscription tier based on plan
      const plan = await subscriptionRepo.findPlanById(subscription.planId)

      if (plan) {
        let subscriptionTier: 'FREE_TRIAL' | 'BASIC' | 'PRO' = 'FREE_TRIAL'
        if (plan.name === 'Basic Profile') {
          subscriptionTier = 'BASIC'
        } else if (plan.name === 'Pro Profile') {
          subscriptionTier = 'PRO'
        }

        // (Prisma's update-by-unique threw — 500 — when no crew profile existed)
        const updatedCrew = await crewProfileRepo.updateByUserId(
          subscription.userId,
          { subscriptionTier: subscriptionTier },
          requester
        )
        if (!updatedCrew) {
          throw new Error('Crew profile not found')
        }
      }
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ subscription: updatedSubscription })

  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
