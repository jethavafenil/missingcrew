import { revalidateTag } from 'next/cache'
import { employerProfileRepo, reviewRepo, crewProfileRepo } from '@/lib/repo'
import { ApiError } from '@/lib/api/errors'
import { handle } from '@/lib/api/handler'
import { parseBody } from '@/lib/api/body'
import { requireRole } from '@/lib/api/auth'
import { reviewSchema } from '@/lib/reviews/schema'

// POST /api/reviews: a producer reviews a crew member they HIRED on one of their projects.
// Posting again for the same project edits the earlier review.
export const POST = handle(async (request) => {
  const { session, requester } = await requireRole('EMPLOYER')
  const input = await parseBody(request, reviewSchema)

  const employer = await employerProfileRepo.findByUserId(session.user.id, requester)
  if (!employer) throw new ApiError(403, 'Producer profile not found', 'FORBIDDEN')

  const crew = await crewProfileRepo.findById(input.crewId)
  if (!crew) throw new ApiError(404, 'Crew member not found', 'NOT_FOUND')

  // Only projects this producer owns, and only where this crew member was hired.
  const eligible = await reviewRepo.eligibleProjects(employer.id, crew.id)
  if (!eligible.some((e) => e.projectId === input.projectId)) {
    throw new ApiError(403, 'You can only review crew you have hired on this project', 'NOT_HIRED')
  }

  const result = await reviewRepo.upsert({ crewId: crew.id, employerId: employer.id, projectId: input.projectId, rating: input.rating, comment: input.comment })
  revalidateTag('crew-profiles', { expire: 0 })
  return Response.json({ review: { id: result.id }, created: result.created }, { status: result.created ? 201 : 200 })
})
