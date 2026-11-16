import { crewProfileRepo } from '@/lib/repo'
import { handle } from '@/lib/api/handler'
import { requireRole } from '@/lib/api/auth'
import { collectProfileLinks } from '@/lib/crew/profileLinks'
import { coreGaps, fullGaps } from '@/lib/crew/readiness'

// GET /api/crew/readiness: what the signed-in crew member still has to add before they can apply
// (core) or accept a hire (full), and the links they can send with an application. Small and never
// cached, so the apply and accept dialogs can ask it every time.
export const GET = handle(async () => {
  const { session } = await requireRole('CREW')
  const profile = await crewProfileRepo.findByUserIdWithUser(session.user.id)
  if (!profile) return Response.json({ hasProfile: false, core: ['photo', 'phone', 'city'], full: ['photo', 'phone', 'city', 'roles', 'steps'], links: [] }, { headers: { 'Cache-Control': 'private, no-store' } })

  const input = { photo: profile.photo, phone: profile.user?.phone, city: profile.city, primaryRoles: profile.primaryRoles, completed: profile.completed }
  return Response.json(
    {
      hasProfile: true,
      core: coreGaps(input),
      full: fullGaps(input),
      links: collectProfileLinks(profile),
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
})
