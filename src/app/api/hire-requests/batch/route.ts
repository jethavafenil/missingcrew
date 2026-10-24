import { crewProfileRepo, employerProfileRepo, projectRepo } from '@/lib/repo'
import { ApiError, normalizeApiError } from '@/lib/api/errors'
import { handle } from '@/lib/api/handler'
import { parseBody } from '@/lib/api/body'
import { requireRole } from '@/lib/api/auth'
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimiter'
import { hireAllSchema } from '@/lib/hire/schema'
import { sendHireRequest } from '@/lib/hire/send'

// POST /api/hire-requests/batch: HIRE ALL from the bucket list. One project, one message,
// up to 20 crew members. Each person is handled on its own; the answer says who got the
// request and why the others did not (already asked, declined, ...).
export async function POST(request: Request) {
  const handler = handle(async () => {
    const { session, requester } = await requireRole('EMPLOYER')
    const limited = await rateLimitMiddleware(request as import('next/server').NextRequest, 'hire-request', { userId: session.user.id, policy: RATE_LIMITS.hireRequest })
    if (limited) return limited

    const input = await parseBody(request, hireAllSchema)

    const employer = await employerProfileRepo.findByUserId(session.user.id, requester)
    if (!employer) throw new ApiError(403, 'Producer profile not found', 'FORBIDDEN')
    const project = await projectRepo.findByIdAndEmployerId(input.projectId, employer.id)
    if (!project) throw new ApiError(404, 'Project not found', 'NOT_FOUND')
    if (project.status !== 'OPEN') throw new ApiError(400, 'This project is no longer open', 'PROJECT_CLOSED')

    const producerName = employer.companyName || session.user.name || 'A producer'
    const results: Array<{ crewId: string; name: string | null; ok: boolean; error?: string }> = []
    for (const crewId of Array.from(new Set(input.crewIds))) {
      const crew = await crewProfileRepo.findByIdWithUser(crewId)
      try {
        await sendHireRequest({ employer, project, producerUserId: session.user.id, producerName, requester, crewId, role: input.role, message: input.message })
        results.push({ crewId, name: crew?.user?.name ?? null, ok: true })
      } catch (err) {
        results.push({ crewId, name: crew?.user?.name ?? null, ok: false, error: normalizeApiError(err).message })
      }
    }
    return { sent: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, results }
  })
  return handler(request, {})
}
