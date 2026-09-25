import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { connectionRepo, notificationRepo, userRepo, requesterFromSession } from '@/lib/repo'
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimiter'
import { z } from 'zod'
import { parseBody } from '@/lib/api/body'
import { ApiError } from '@/lib/api/errors'


export async function POST(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const limited = await rateLimitMiddleware(req, 'connection-request', { userId: session.user.id, policy: RATE_LIMITS.connectionRequest })
    if (limited) return limited

    // User ids are TEXT and may be legacy Prisma cuids or UUIDs — existence
    // is validated by the userRepo lookup below (404 for unknown ids).
    const { receiverId } = await parseBody(req, z.object({ receiverId: z.string().min(1) }))

    // Check if user is trying to connect with themselves
    if (receiverId === session.user.id) {
      return NextResponse.json({ error: 'Cannot send connection request to yourself' }, { status: 400 })
    }

    const requester = requesterFromSession(session)

    // Check if receiver exists
    const receiver = await userRepo.findByIdRaw(receiverId)

    if (!receiver) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if connection request already exists (in either direction)
    const existingConnection = await connectionRepo.findExistingBetween(session.user.id, receiverId)

    if (existingConnection) {
      if (existingConnection.status === 'ACCEPTED') {
        return NextResponse.json({ error: 'Already connected' }, { status: 400 })
      }
      if (existingConnection.status === 'PENDING') {
        return NextResponse.json({ error: 'Connection request already sent' }, { status: 400 })
      }
      if (existingConnection.status === 'REJECTED') {
        // Update the rejected connection to pending
        await connectionRepo.update(
          existingConnection.id,
          {
            status: 'PENDING',
            requesterId: session.user.id,
            receiverId
          },
          requester
        )
        const updatedConnection = (await connectionRepo.findById(existingConnection.id))!

        // Create notification for receiver
        await notificationRepo.create({
          userId: receiverId,
          type: 'CONNECTION_REQUEST',
          title: 'New Connection Request',
          message: `${session.user.name || session.user.email} wants to connect with you`,
          data: {
            requesterId: session.user.id,
            connectionId: updatedConnection.id
          }
        }, requester)

        return NextResponse.json({ connection: updatedConnection })
      }
    }

    // Create new connection request
    const connection = await connectionRepo.create(
      {
        requesterId: session.user.id,
        receiverId
      },
      requester
    )
    const connectionWithUsers = (await connectionRepo.findById(connection.id))!

    // Create notification for receiver
    await notificationRepo.create({
      userId: receiverId,
      type: 'CONNECTION_REQUEST',
      title: 'New Connection Request',
      message: `${session.user.name || session.user.email} wants to connect with you`,
      data: {
        requesterId: session.user.id,
        connectionId: connectionWithUsers.id
      }
    }, requester)

    return NextResponse.json({ connection: connectionWithUsers })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Error creating connection request:', error)
    return NextResponse.json(
      { error: 'Failed to send connection request' },
      { status: 500 }
    )
  }
}
