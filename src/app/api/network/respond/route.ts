import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { connectionRepo, notificationRepo, requesterFromSession } from '@/lib/repo'


export async function POST(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { connectionId, action } = await req.json()

    if (!connectionId || !action) {
      return NextResponse.json({ error: 'Connection ID and action are required' }, { status: 400 })
    }

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Use "accept" or "reject"' }, { status: 400 })
    }

    // Find the connection request
    const connection = await connectionRepo.findById(connectionId)

    if (!connection) {
      return NextResponse.json({ error: 'Connection request not found' }, { status: 404 })
    }

    // Verify that the current user is the receiver
    if (connection.receiverId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized to respond to this request' }, { status: 403 })
    }

    // Check if already responded
    if (connection.status !== 'PENDING') {
      return NextResponse.json({ error: `Connection request already ${connection.status.toLowerCase()}` }, { status: 400 })
    }

    // Update connection status
    await connectionRepo.update(
      connectionId,
      { status: action === 'accept' ? 'ACCEPTED' : 'REJECTED' },
      requesterFromSession(session)
    )
    const updatedConnection = (await connectionRepo.findById(connectionId))!

    // Create notification for requester if accepted
    if (action === 'accept') {
      await notificationRepo.create({
        userId: connection.requesterId,
        type: 'CONNECTION_ACCEPTED',
        title: 'Connection Request Accepted',
        message: `${session.user.name || session.user.email} accepted your connection request`,
        data: {
          receiverId: session.user.id,
          connectionId: connection.id
        }
      }, requesterFromSession(session))
    }

    return NextResponse.json({ 
      connection: updatedConnection,
      message: `Connection request ${action}ed successfully`
    })
  } catch (error) {
    console.error('Error responding to connection request:', error)
    return NextResponse.json(
      { error: 'Failed to respond to connection request' },
      { status: 500 }
    )
  }
}
