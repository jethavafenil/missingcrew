import { NextRequest, NextResponse } from 'next/server'
import { connectionRepo, SYSTEM_REQUESTER } from '@/lib/repo'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: userId } = await context.params

    if (!userId) {
      return NextResponse.json({ error: 'User id is required' }, { status: 400 })
    }

    const connections = await connectionRepo.findManyByUserId(userId, SYSTEM_REQUESTER, {
      status: 'ACCEPTED',
    })

    const transformedConnections = connections.map((conn) => {
      const otherUser = conn.requesterId === userId ? conn.receiver : conn.requester
      return {
        id: conn.id,
        connectedAt: conn.updatedAt,
        user: otherUser,
      }
    })

    return NextResponse.json({ connections: transformedConnections, count: transformedConnections.length })
  } catch (error) {
    console.error('Error fetching public user connections:', error)
    return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 })
  }
}
