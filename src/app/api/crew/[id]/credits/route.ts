import { NextRequest, NextResponse } from 'next/server'
import { applicationRepo } from '@/lib/repo'
import { getPublicCrewProfile } from '@/lib/cache/public'
import { getSession } from '@/lib/auth/server'
import { buildCredits, currentEngagements } from '@/lib/crew/credits'

interface RouteContext {
  params: Promise<{ id: string }>
}

// Verified production credits, current engagement and hired-project count of a crew
// member. Derived from HIRED applications, so it only shows work done through MissingCrew.
// Visitors who are not signed in only get the count.
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const crew = await getPublicCrewProfile(id)
    if (!crew) return NextResponse.json({ error: 'Crew member not found' }, { status: 404 })

    const sources = await applicationRepo.findHiredCreditSources(crew.id)
    const credits = buildCredits(sources, crew.primaryRoles ?? [])

    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json(
        { credits: [], currentEngagements: [], hiredCount: credits.length, locked: true },
        { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } },
      )
    }
    return NextResponse.json(
      { credits, currentEngagements: currentEngagements(credits), hiredCount: credits.length, locked: false },
      { headers: { 'Cache-Control': 'private, no-cache' } },
    )
  } catch (error) {
    console.error('Error fetching crew credits:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
