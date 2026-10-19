import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { employerProfileRepo, projectRepo, requesterFromSession } from '@/lib/repo'
import { isBeforeToday } from '@/lib/utils'
import { projectInputSchema } from '@/lib/projects/schema'
import { parseBody } from '@/lib/api/body'
import { ApiError } from '@/lib/api/errors'

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
      shootStartDate: project.shootStartDate ? project.shootStartDate.toISOString() : null,
      shootEndDate: project.shootEndDate ? project.shootEndDate.toISOString() : null
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
    const input = await parseBody(request, projectInputSchema)

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

    // A changed start date can't be moved into the past (unchanged dates stay
    // editable for projects that are already running).
    const dayKey = (d: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : null)
    const startChanged = dayKey(input.shootStartDate) !== dayKey(existingProject.shootStartDate)
    if (startChanged && input.shootStartDate && isBeforeToday(input.shootStartDate)) {
      return NextResponse.json({ error: 'Shoot start date cannot be in the past' }, { status: 400 })
    }

    // Update the project
    const project = await projectRepo.update(id, {
      projectName: input.projectName,
      projectType: input.projectType,
      rolesNeeded: input.rolesNeeded,
      shootStartDate: input.shootStartDate,
      shootEndDate: input.shootEndDate,
      location: input.location,
      budgetMin: input.budgetMin,
      budgetMax: input.budgetMax,
      budgetFixed: input.budgetFixed,
      productionHouse: input.productionHouse,
      tags: input.tags,
      description: input.description,
      questions: input.questions,
      contactPreference: input.contactPreference,
    }, requester)

    return NextResponse.json({ project }, { status: 200 })
  } catch (error) {
    // Validation failures (400) carry a user-facing message; surface them.
    if (error instanceof ApiError && error.status < 500) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
