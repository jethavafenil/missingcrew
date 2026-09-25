import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { connectionRepo, requesterFromSession } from '@/lib/repo'


export async function GET(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all pending connection requests received by the user
    const receivedRequests = await connectionRepo.findIncomingByUserId(
      session.user.id,
      requesterFromSession(session),
      { status: 'PENDING' }
    )

    // Get all pending connection requests sent by the user
    const sentRequests = await connectionRepo.findSentByUserId(
      session.user.id,
      requesterFromSession(session),
      { status: 'PENDING' }
    )

    return NextResponse.json({
      receivedRequests,
      sentRequests
    })
  } catch (error) {
    console.error('Error fetching connection requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch connection requests' },
      { status: 500 }
    )
  }
}
