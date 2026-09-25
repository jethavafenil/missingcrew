import { getSession } from '@/lib/auth/server'
import { NextRequest, NextResponse } from 'next/server'
import { userRepo, requesterFromSession, assertAdmin } from '@/lib/repo'
import { getAdminAuthClient } from '@/lib/auth/admin'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { name, email, phone, role, emailVerified, phoneVerified } = body

    // Update user (throws when the user doesn't exist, matching Prisma's 500)
    const user = await userRepo.updateUser(
      id,
      {
        name,
        email,
        phone,
        role,
        emailVerified: emailVerified ? new Date() : null,
        phoneVerified
      },
      requesterFromSession(session)
    )

    return NextResponse.json({ success: true, user })
  } catch (error: any) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Prevent deleting yourself
    if (session.user.id === id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Delete app row (foreign-key cascades delete related records), then the
    // GoTrue identity.
    const requester = assertAdmin(requesterFromSession(session))
    const user = await userRepo.findById(id, requester)
    await userRepo.deleteUser(id, requester)
    if (user?.authId) {
      const { error } = await getAdminAuthClient().deleteUser(user.authId)
      if (error) console.error('Failed to delete auth user:', error.message)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    )
  }
}
