import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { subscriptionRepo, assertAdmin, requesterFromSession } from '@/lib/repo'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, price, description, features } = await request.json()

    // Create new subscription plan
    const newPlan = await subscriptionRepo.createPlan(
      {
        name,
        price,
        description,
        features
      },
      assertAdmin(requesterFromSession(session))
    )

    return NextResponse.json({ plan: newPlan })

  } catch (error) {
    console.error('Error creating subscription plan:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, name, price, description, features } = await request.json()

    // Update subscription plan (throws when the plan doesn't exist, matching Prisma's 500)
    const updatedPlan = await subscriptionRepo.updatePlan(
      id,
      {
        name,
        price,
        description,
        features
      },
      assertAdmin(requesterFromSession(session))
    )
    if (!updatedPlan) {
      throw new Error('Plan not found')
    }

    return NextResponse.json({ plan: updatedPlan })

  } catch (error) {
    console.error('Error updating subscription plan:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
