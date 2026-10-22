import { NextRequest, NextResponse } from 'next/server'
import { employerProfileRepo, reviewRepo, requesterFromSession } from '@/lib/repo'
import { getPublicCrewProfile } from '@/lib/cache/public'
import { getSession } from '@/lib/auth/server'
import { summarizeRatings } from '@/lib/reviews/schema'

interface RouteContext {
  params: Promise<{ id: string }>
}

// Reviews of a crew member (public), plus, for a signed-in producer, the projects
// they hired this person on and may review.
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const crew = await getPublicCrewProfile(id)
    if (!crew) return NextResponse.json({ error: 'Crew member not found' }, { status: 404 })

    const reviews = await reviewRepo.listForCrew(crew.id)
    const summary = summarizeRatings(reviews.map((r) => r.rating))

    const session = await getSession()
    if (session?.user?.role === 'EMPLOYER') {
      const employer = await employerProfileRepo.findByUserId(session.user.id, requesterFromSession(session))
      const eligible = employer ? await reviewRepo.eligibleProjects(employer.id, crew.id) : []
      return NextResponse.json({ reviews, ...summary, eligible }, { headers: { 'Cache-Control': 'private, no-cache' } })
    }
    return NextResponse.json({ reviews, ...summary, eligible: [] }, { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
