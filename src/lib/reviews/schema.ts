import { z } from 'zod'

// Ids are TEXT (legacy cuids + uuids).
const id = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, 'Invalid id')

export const MAX_REVIEW_COMMENT = 1000

export const reviewSchema = z.object({
  crewId: id,
  projectId: id,
  rating: z.number().int('Rating must be a whole number').min(1, 'Pick a rating from 1 to 5').max(5, 'Pick a rating from 1 to 5'),
  comment: z.string().trim().max(MAX_REVIEW_COMMENT, `Review must be ${MAX_REVIEW_COMMENT} characters or fewer`).default(''),
})

export interface RatingSummary {
  average: number | null
  count: number
}

// One decimal, null when nobody has reviewed yet.
export function summarizeRatings(ratings: number[]): RatingSummary {
  if (ratings.length === 0) return { average: null, count: 0 }
  const sum = ratings.reduce((a, b) => a + b, 0)
  return { average: Math.round((sum / ratings.length) * 10) / 10, count: ratings.length }
}
