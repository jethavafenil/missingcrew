import { NextRequest, NextResponse } from 'next/server'
import { crewProfileRepo, applicationRepo } from '@/lib/repo'
import { getPublicCrewProfile } from '@/lib/cache/public'
import { getSession } from '@/lib/auth/server'
import { hasProBadge } from '@/lib/subscription/access'
import { arePaidPlansEnabled } from '@/lib/settings'
import { crewTags } from '@/lib/matching'
import { vimeoId, youtubeId } from '@/lib/crew/profileFields'
import { stripGuestProfile } from '@/lib/crew/guestView'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: rawParam } = await context.params
    const { searchParams } = new URL(request.url)

    // Resolve param: it can be a CrewProfile.id or a slug of user.name
    const resolveCrewByParam = async () => {
      // Try by ID first
      let crew = await crewProfileRepo.findByIdWithUser(rawParam)

      if (crew) return crew

      // Fallback: interpret param as slug of user.name
      const decoded = decodeURIComponent(rawParam)
      const possibleName = decoded.replace(/-/g, ' ').trim()
      if (!possibleName) return null

      // First try exact name match (case-insensitive)
      crew = await crewProfileRepo.findFirstByUserNameExact(possibleName)

      if (crew) return crew

      // Fallback: match by words contained in name (case-insensitive)
      const words = possibleName.split(/\s+/).filter(Boolean)
      if (words.length) {
        crew = await crewProfileRepo.findFirstByUserNameContainsAll(words)
      }

      return crew
    }

    // If this is a request for applications, we need the actual crew id first
    if (searchParams.has('applications')) {
      const crew = await resolveCrewByParam()
      if (!crew) {
        return NextResponse.json(
          { error: 'Crew member not found' },
          { status: 404 }
        )
      }

      // Applications are private: only the crew member who owns them (or an
      // admin) may read them.
      const session = await getSession()
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      if (session.user.role !== 'ADMIN' && session.user.id !== crew.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const rows = await applicationRepo.findManyWithProjectAndCrew({
        crewId: crew.id
      })

      // Strip data the crew member must not see: the employer's private notes
      // and the employer's contact email. The crew embed is dropped (it is the
      // caller's own profile and unused by the client).
      const applications = rows.map(({ employerNotes: _employerNotes, crew: _crew, ...app }) => ({
        ...app,
        project: app.project && {
          ...app.project,
          employer: app.project.employer && {
            ...app.project.employer,
            user: app.project.employer.user && { ...app.project.employer.user, email: undefined },
          },
        },
      }))

      return NextResponse.json({ applications }, { headers: { 'Cache-Control': 'private, no-store' } })
    }

    // Default behavior - fetch crew profile (supports id or slug)
    const crew = await getPublicCrewProfile(rawParam)

    if (!crew) {
      return NextResponse.json(
        { error: 'Crew member not found' },
        { status: 404 }
      )
    }

    // Contact details (phone/email/WhatsApp) are visible to employers and
    // the profile owner; everyone else gets them stripped. Unauthenticated
    // responses stay CDN-cacheable; authenticated ones are private so a
    // scrubbed/allowed version can never poison the shared cache.
    const session = await getSession()
    const canViewContacts =
      session?.user?.role === 'EMPLOYER' ||
      (session?.user?.id != null && session.user.id === crew.userId)

    const proBadge = hasProBadge(crew, new Date(), await arePaidPlansEnabled())

    // Showreel: the one the crew member chose, else the first video link in their portfolio.
    const videoLink = (crew.portfolioLinks ?? []).find((l) => typeof l === 'string' && (youtubeId(l) || vimeoId(l)))
    const detail = {
      ...crew,
      hasProBadge: proBadge,
      showreelUrl: crew.showreelUrl || videoLink || null,
      tags: crewTags(crew),
    }

    if (canViewContacts) {
      return NextResponse.json({ crew: { ...detail, gender: undefined } }, { headers: { 'Cache-Control': 'private, no-cache' } })
    }

    // Anyone signed in sees the work links and IMDb; guests only see the public card
    // information. Contact details stay employer/owner only.
    const publicCrew = {
      ...detail,
      gender: undefined,
      contactWhatsApp: null,
      user: crew.user ? { ...crew.user, email: undefined, phone: undefined } : undefined,
    }
    if (session?.user?.id) {
      return NextResponse.json({ crew: publicCrew }, { headers: { 'Cache-Control': 'private, no-cache' } })
    }
    return NextResponse.json({ crew: stripGuestProfile(publicCrew) }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } })
  } catch (error) {
    console.error('Error fetching crew data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
