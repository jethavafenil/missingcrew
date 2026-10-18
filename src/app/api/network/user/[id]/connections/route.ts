import { NextRequest, NextResponse } from 'next/server'
import { connectionRepo, SYSTEM_REQUESTER } from '@/lib/repo'

// Ids are TEXT (legacy cuids + new uuids); this charset also rules out
// PostgREST filter metacharacters (, . ( ) etc).
const SAFE_ID_RE = /^[A-Za-z0-9_-]{1,64}$/

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: userId } = await context.params

    // The id is interpolated into a PostgREST `.or()` filter downstream, so it
    // must match the safe id charset (prevents filter injection on this public route).
    if (!userId || !SAFE_ID_RE.test(userId)) {
      return NextResponse.json({ error: 'Valid user id is required' }, { status: 400 })
    }

    const connections = await connectionRepo.findManyByUserId(userId, SYSTEM_REQUESTER, {
      status: 'ACCEPTED',
    })

    // Public endpoint: never expose contact details of the people in someone's
    // network. Contact info is only available via the authenticated
    // /api/network/connections route (the viewer's own connections).
    const transformedConnections = connections.map((conn) => {
      const otherUser = conn.requesterId === userId ? conn.receiver : conn.requester
      return {
        id: conn.id,
        connectedAt: conn.updatedAt,
        user: otherUser && {
          ...otherUser,
          email: '',
          phone: null,
          crewProfile: otherUser.crewProfile
            ? { ...otherUser.crewProfile, contactWhatsApp: null }
            : otherUser.crewProfile,
        },
      }
    })

    return NextResponse.json({ connections: transformedConnections, count: transformedConnections.length })
  } catch (error) {
    console.error('Error fetching public user connections:', error)
    return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 })
  }
}
