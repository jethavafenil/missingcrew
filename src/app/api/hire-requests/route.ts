import { after, NextRequest, NextResponse } from 'next/server'
import {
  crewProfileRepo,
  employerProfileRepo,
  hireRequestRepo,
  notificationRepo,
  projectRepo,
  type HireRequestWithRelations,
} from '@/lib/repo'
import { ApiError } from '@/lib/api/errors'
import { handle } from '@/lib/api/handler'
import { parseBody } from '@/lib/api/body'
import { requireAuth } from '@/lib/api/auth'
import { createHireRequestEmail, sendEmail } from '@/lib/email'
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

    const crew = await crewProfileRepo.findByIdWithUser(input.crewId)
    if (!crew) throw new ApiError(404, 'Crew member not found', 'NOT_FOUND')
    if (crew.userId === session.user.id) throw new ApiError(400, 'You cannot hire yourself', 'INVALID')

    const existing = await hireRequestRepo.findByProjectAndCrew(project.id, crew.id)
    let created
    if (existing) {
      if (existing.status === 'CANCELLED') {
        created = await hireRequestRepo.reopenCancelled(existing.id, { role: input.role, message: input.message })
      }
      if (!created) {
        const why =
          existing.status === 'ACCEPTED' ? 'This crew member is already hired for this project'
          : existing.status === 'DECLINED' ? 'This crew member declined this project'
          : 'A hire request is already pending for this crew member and project'
        throw new ApiError(409, why, 'DUPLICATE_REQUEST')
      }
    } else {
      try {
        created = await hireRequestRepo.create({ employerId: employer.id, crewId: crew.id, projectId: project.id, role: input.role, message: input.message })
      } catch (err) {
        // Unique (project, crew) lost a race with a parallel request.
        if (err instanceof Error && /duplicate key|23505/i.test(err.message)) {
          throw new ApiError(409, 'A hire request is already pending for this crew member and project', 'DUPLICATE_REQUEST')
        }
        throw err
      }
    }

    const producerName = employer.companyName || session.user.name || 'A producer'
    try {
      await notificationRepo.create({
        userId: crew.userId,
        type: 'HIRE_REQUEST',
        title: 'New hire request',
        message: `${producerName} wants to hire you${input.role ? ` as ${input.role}` : ''} for ${project.projectName}.`,
        data: { hireRequestId: created.id, projectId: project.id },
      }, requester)
    } catch (error) {
      console.error('Hire request notification failed:', error)
    }
    if (crew.user?.email) {
      const to = crew.user.email
      const crewName = crew.user.name || 'there'
      const projectName = project.projectName
      const role = input.role ?? null
      const text = input.message
      // Email is sent after the response (SMTP can take seconds); failures are only logged.
      after(async () => {
        try {
          const { subject, html } = createHireRequestEmail(crewName, producerName, projectName, role, text)
          await sendEmail({ to, subject, html })
        } catch (error) {
          console.error('Hire request email failed:', error)
        }
      })
    }

    return NextResponse.json({ request: { id: created.id, status: created.status } }, { status: 201 })
  })
  return handler(request, {})
}
