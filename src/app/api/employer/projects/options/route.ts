import { employerProfileRepo, projectRepo } from '@/lib/repo'
import { handle } from '@/lib/api/handler'
import { requireRole } from '@/lib/api/auth'

// GET /api/employer/projects/options - a light list of the producer's OPEN projects
// (no applicants), used by the Hire Now dialog.
export const GET = handle(async () => {
  const { session, requester } = await requireRole('EMPLOYER')
  const employer = await employerProfileRepo.findByUserId(session.user.id, requester)
  if (!employer) return { projects: [] }

  const projects = await projectRepo.findManyByEmployerId(employer.id, requester)
  return {
    projects: projects
      .filter((p) => p.status === 'OPEN')
      .map((p) => ({
        id: p.id,
        projectName: p.projectName,
        projectType: p.projectType,
        rolesNeeded: (Array.isArray(p.rolesNeeded) ? p.rolesNeeded : []).map((r: unknown) =>
          typeof r === 'string' ? r : (r as { role?: string })?.role ?? '',
        ).filter(Boolean),
        location: p.location,
        shootStartDate: p.shootStartDate,
        shootEndDate: p.shootEndDate,
        productionHouse: p.productionHouse,
      })),
  }
})
