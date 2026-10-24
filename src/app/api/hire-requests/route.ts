import { NextRequest, NextResponse } from 'next/server'
import {
  crewProfileRepo,
  employerProfileRepo,
  hireRequestRepo,
  projectRepo,
  type HireRequestWithRelations,
} from '@/lib/repo'
import { ApiError } from '@/lib/api/errors'
import { handle } from '@/lib/api/handler'
import { parseBody } from '@/lib/api/body'
import { requireAuth } from '@/lib/api/auth'
import { sendHireRequest } from '@/lib/hire/send'
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimiter'
import { createHireRequestSchema } from '@/lib/hire/schema'

// What each side is allowed to see: never the other party's email address.
function toCrewView(r: HireRequestWithRelations) {
  return {
    id: r.id,
    status: r.status,
    role: r.role,
    message: r.message,
    createdAt: r.createdAt,
    respondedAt: r.respondedAt,
    producerName: r.employer?.companyName || r.employer?.user?.name || 'A producer',
    project: r.project && {
      id: r.project.id,
      projectName: r.project.projectName,
      projectType: r.project.projectType,
      location: r.project.location,
      shootStartDate: r.project.shootStartDate,
      shootEndDate: r.project.shootEndDate,
      productionHouse: r.project.productionHouse,
    },
  }
}

function toEmployerView(r: HireRequestWithRelations) {
  return {
    id: r.id,
    status: r.status,
    role: r.role,
    message: r.message,
    createdAt: r.createdAt,
    respondedAt: r.respondedAt,
    crew: r.crew && { id: r.crew.id, name: r.crew.user?.name ?? 'Crew member', photo: r.crew.photo, primaryRoles: r.crew.primaryRoles },
    project: r.project && { id: r.project.id, projectName: r.project.projectName },
  }
}

// GET /api/hire-requests - crew: requests sent to me; producer: requests I sent (?crewId= to filter)
export const GET = handle(async (request) => {
  const { session, requester } = await requireAuth()
  if (session.user.role === 'CREW') {
    const crew = await crewProfileRepo.findByUserId(session.user.id, requester)
    const list = crew ? await hireRequestRepo.listForCrew(crew.id) : []
    return { requests: list.map(toCrewView) }
  }
  if (session.user.role === 'EMPLOYER') {
    const employer = await employerProfileRepo.findByUserId(session.user.id, requester)
    const crewId = new URL(request.url).searchParams.get('crewId') || undefined
    const list = employer ? await hireRequestRepo.listForEmployer(employer.id, { crewId }) : []
    return { requests: list.map(toEmployerView) }
  }
  throw new ApiError(403, 'Forbidden', 'FORBIDDEN')
})

// POST /api/hire-requests - a producer asks a crew member to join one of their projects
export async function POST(request: NextRequest) {
  const handler = handle(async () => {
    const { session, requester } = await requireAuth()
    if (session.user.role !== 'EMPLOYER') throw new ApiError(403, 'Only producers can send hire requests', 'FORBIDDEN')

    const limited = await rateLimitMiddleware(request, 'hire-request', { userId: session.user.id, policy: RATE_LIMITS.hireRequest })
    if (limited) return limited

    const input = await parseBody(request, createHireRequestSchema)

    const employer = await employerProfileRepo.findByUserId(session.user.id, requester)
    if (!employer) throw new ApiError(403, 'Producer profile not found', 'FORBIDDEN')

    // The project must be this producer's own, and still open.
    const project = await projectRepo.findByIdAndEmployerId(input.projectId, employer.id)
    if (!project) throw new ApiError(404, 'Project not found', 'NOT_FOUND')
    if (project.status !== 'OPEN') throw new ApiError(400, 'This project is no longer open', 'PROJECT_CLOSED')

    const producerName = employer.companyName || session.user.name || 'A producer'
    const created = await sendHireRequest({
      employer,
      project,
      producerUserId: session.user.id,
      producerName,
      requester,
      crewId: input.crewId,
      role: input.role,
      message: input.message,
    })

    return NextResponse.json({ request: { id: created.id, status: created.status } }, { status: 201 })
  })
  return handler(request, {})
}
