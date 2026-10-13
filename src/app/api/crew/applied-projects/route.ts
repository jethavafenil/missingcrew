import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { applicationRepo, crewProfileRepo, wishlistRepo, requesterFromSession } from '@/lib/repo'

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ appliedProjectIds: [], wishlistedProjectIds: [] })
    }

    const requester = requesterFromSession(session)
    const crewProfile = await crewProfileRepo.findByUserId(session.user.id, requester)

    let appliedProjectIds: string[] = []
    if (crewProfile) {
      appliedProjectIds = await applicationRepo.findAppliedProjectIdsForCrew(crewProfile.id)
    }

    let wishlistedProjectIds: string[] = []
    if (session.user.role === 'CREW') {
      wishlistedProjectIds = await wishlistRepo.findWishlistedProjectIds(session.user.id)
    }

    return NextResponse.json(
      {
        appliedProjectIds,
        wishlistedProjectIds,
      },
      {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching applied projects:', error)
    return NextResponse.json({ appliedProjectIds: [], wishlistedProjectIds: [] }, { status: 500 })
  }
}
