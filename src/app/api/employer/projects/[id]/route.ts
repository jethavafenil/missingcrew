import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { employerProfileRepo, projectRepo, requesterFromSession } from '@/lib/repo'

// GET /api/employer/projects/[id] - Get a single project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requester = requesterFromSession(session)

    const { id } = await params

    // Fetch the employer profile
    const employerProfile = await employerProfileRepo.findByUserId(session.user.id, requester)

    if (!employerProfile) {
      return NextResponse.json(
        { error: 'Employer profile not found' },
        { status: 404 }
      )
    }

    // Fetch the project
    const project = await projectRepo.findByIdAndEmployerId(id, employerProfile.id)

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Format the project for response
    const formattedProject = {
      ...project,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      shootStartDate: project.shootStartDate.toISOString(),
      shootEndDate: project.shootEndDate.toISOString()
    }

    return NextResponse.json({ project: formattedProject })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// PUT /api/employer/projects/[id] - Update a project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const {
      projectName,
      projectType,
      rolesNeeded,
      shootStartDate,
      shootEndDate,
      location,
      budgetPerRole,
      description,
      questions,
      contactPreference
    } = body

    if (!projectName || !projectType || !rolesNeeded || !shootStartDate || !shootEndDate || !location || !description || !questions || !contactPreference) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const requester = requesterFromSession(session)

    // Fetch the employer profile
    const employerProfile = await employerProfileRepo.findByUserId(session.user.id, requester)

    if (!employerProfile) {
      return NextResponse.json(
        { error: 'Employer profile not found' },
        { status: 404 }
      )
    }

    // Check if the project belongs to this employer
    const existingProject = await projectRepo.findByIdAndEmployerId(id, employerProfile.id)

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found or unauthorized' },
        { status: 404 }
      )
    }

    // Update the project
    const project = await projectRepo.update(id, {
      projectName,
      projectType,
      rolesNeeded,
      shootStartDate: new Date(shootStartDate),
      shootEndDate: new Date(shootEndDate),
      location,
      budgetPerRole: budgetPerRole ? parseFloat(budgetPerRole) : undefined,
      description,
      questions,
      contactPreference
    }, requester)

    return NextResponse.json({ project }, { status: 200 })
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
