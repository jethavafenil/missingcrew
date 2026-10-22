import { describe, it, expect } from 'vitest'
import { reviewSchema, summarizeRatings } from './schema'

const base = { crewId: 'abc-123', projectId: 'p_1', rating: 5, comment: 'Great work' }

describe('reviewSchema', () => {
  it('accepts a valid review and trims the comment', () => {
    expect(reviewSchema.parse({ ...base, comment: '  Great  ' }).comment).toBe('Great')
  })
  it('allows an empty comment', () => {
    expect(reviewSchema.parse({ crewId: 'a', projectId: 'b', rating: 3 }).comment).toBe('')
  })
  it('rejects ratings outside 1-5 or fractional', () => {
    for (const rating of [0, 6, 2.5, -1]) expect(reviewSchema.safeParse({ ...base, rating }).success).toBe(false)
  })
  it('rejects bad ids and long comments', () => {
    expect(reviewSchema.safeParse({ ...base, crewId: 'a b;c' }).success).toBe(false)
    expect(reviewSchema.safeParse({ ...base, comment: 'x'.repeat(1001) }).success).toBe(false)
  })
})

describe('summarizeRatings', () => {
  it('averages to one decimal', () => {
    expect(summarizeRatings([5, 4, 4])).toEqual({ average: 4.3, count: 3 })
  })
  it('is empty-safe', () => {
    expect(summarizeRatings([])).toEqual({ average: null, count: 0 })
  })
})
