import { NextRequest, NextResponse } from 'next/server'
import { crewProfileRepo, applicationRepo } from '@/lib/repo'
import { getPublicCrewProfile } from '@/lib/cache/public'
import { getSession } from '@/lib/auth/server'

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

      const applications = await applicationRepo.findManyWithProjectAndCrew({
        crewId: crew.id
      })

      return NextResponse.json({ applications })
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

    if (canViewContacts) {
      return NextResponse.json({ crew }, { headers: { 'Cache-Control': 'private, max-age=60' } })
    }

    const publicCrew = {
      ...crew,
      contactWhatsApp: null,
      user: crew.user ? { ...crew.user, email: undefined, phone: undefined } : undefined,
    }
    return NextResponse.json({ crew: publicCrew }, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } })
  } catch (error) {
    console.error('Error fetching crew data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
