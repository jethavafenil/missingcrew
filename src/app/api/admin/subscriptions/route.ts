import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { subscriptionRepo, assertAdmin, requesterFromSession } from '@/lib/repo'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all subscriptions with user and plan details
    const subscriptions = await subscriptionRepo.findManyAdmin(
      assertAdmin(requesterFromSession(session))
    )

    return NextResponse.json({ subscriptions })

  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
