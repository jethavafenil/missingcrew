import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { connectionRepo, requesterFromSession } from '@/lib/repo'


export async function GET(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all accepted connections where user is either requester or receiver
    const connections = await connectionRepo.findManyByUserId(
      session.user.id,
      requesterFromSession(session),
      { status: 'ACCEPTED' }
    )

    // Transform connections to return the other user's info
    const transformedConnections = connections.map((conn) => {
      const otherUser = conn.requesterId === session.user?.id ? conn.receiver : conn.requester
      return {
        id: conn.id,
        connectedAt: conn.updatedAt,
        user: otherUser
      }
    })

    return NextResponse.json({
      connections: transformedConnections,
      count: transformedConnections.length
    })
  } catch (error) {
    console.error('Error fetching connections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
      { status: 500 }
    )
  }
}
