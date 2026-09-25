import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { userRepo, requesterFromSession } from '@/lib/repo'


export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user data (role-gated profile includes, matching the Prisma-era query)
    const user = await userRepo.findById(
      session.user.id,
      requesterFromSession(session)
    )

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Return user data based on role
    const crewProfile =
      session.user.role === 'CREW' && user.crewProfile
        ? user.crewProfile as {
            createdAt?: Date | null
            updatedAt?: Date | null
            [key: string]: unknown
          }
        : null
    const responseData = {
      email: user.email,
      name: user.name,
      role: user.role,
      ...(crewProfile && {
        crewProfile: {
          ...crewProfile,
          // Ensure dates are properly serialized
          createdAt: crewProfile.createdAt?.toISOString(),
          updatedAt: crewProfile.updatedAt?.toISOString()
        }
      }),
      ...(session.user.role === 'EMPLOYER' && user.employerProfile && { employerProfile: user.employerProfile }),
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
