import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { employerProfileRepo, requesterFromSession } from '@/lib/repo'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requester = requesterFromSession(session)

    const { companyName, companyWebsite } = await request.json()

    // Update or create employer profile
    const employerProfile = await employerProfileRepo.upsertByUserId(
      session.user.id,
      {
        companyName,
        companyWebsite,
      },
      requester
    )

    // Mark profile as completed
    await employerProfileRepo.updateByUserId(session.user.id, { completed: true }, requester)

    return NextResponse.json({
      success: true,
      employerProfile,
    })
  } catch (error) {
    console.error('Error updating employer profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch employer profile with projects and applications
    const employerProfile = await employerProfileRepo.findByUserIdWithProjectsAndApplications(
      session.user.id
    )

    if (!employerProfile) {
      return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      employerProfile,
    })
  } catch (error) {
    console.error('Error fetching employer profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requester = requesterFromSession(session)

    const { companyName, companyWebsite } = await request.json()

    // Update employer profile (Prisma's update-by-unique threw when the row
    // was missing; preserve that 500 error path)
    const employerProfile = await employerProfileRepo.updateByUserId(
      session.user.id,
      {
        companyName,
        companyWebsite,
      },
      requester
    )
    if (!employerProfile) {
      throw new Error('Employer profile not found')
    }

    return NextResponse.json({
      success: true,
      employerProfile,
    })
  } catch (error) {
    console.error('Error updating employer profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
