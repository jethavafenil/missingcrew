import { describe, it, expect } from 'vitest'
import { buildCredits, creditStatus, currentEngagements, pickRole, type CreditSource } from './credits'

const today = new Date(2026, 10, 20) // 20 Nov 2026

const src = (over: Partial<CreditSource> = {}): CreditSource => ({
  projectId: 'p1', projectName: 'Night Shift', projectType: 'Short Film', productionHouse: 'ABC Studios',
  producerName: 'Ravi', location: 'Mumbai', rolesNeeded: ['Cinematographer'],
  startDate: new Date(2026, 10, 12), endDate: new Date(2026, 10, 25), hiredRole: null, ...over,
})

describe('creditStatus', () => {
  it('is ongoing between start and end (inclusive)', () => {
    expect(creditStatus(new Date(2026, 10, 12), new Date(2026, 10, 20), today)).toBe('ONGOING')
  })
  it('is upcoming before the start', () => {
    expect(creditStatus(new Date(2026, 11, 1), new Date(2026, 11, 5), today)).toBe('UPCOMING')
  })
  it('is completed after the end', () => {
    expect(creditStatus(new Date(2026, 9, 1), new Date(2026, 9, 5), today)).toBe('COMPLETED')
  })
  it('is confirmed when the producer gave no dates', () => {
    expect(creditStatus(null, null, today)).toBe('CONFIRMED')
  })
  it('does not claim ongoing for a past start with no end', () => {
    expect(creditStatus(new Date(2026, 9, 1), null, today)).toBe('COMPLETED')
  })
})

describe('pickRole', () => {
  it('prefers the role agreed in the hire request', () => {
    expect(pickRole(' 1st AD ', ['DOP'], ['Editor'])).toBe('1st AD')
  })
  it('falls back to a needed role the crew member offers', () => {
    expect(pickRole(null, ['Editor', 'DOP'], ['dop'])).toBe('DOP')
  })
  it('falls back to the main role, then the first needed role', () => {
    expect(pickRole(null, ['Editor'], ['Sound'])).toBe('Sound')
    expect(pickRole(null, ['Editor'], [])).toBe('Editor')
  })
})

describe('buildCredits', () => {
  it('keeps one credit per project and sorts newest first', () => {
    const credits = buildCredits(
      [src(), src(), src({ projectId: 'p2', startDate: new Date(2026, 5, 1), endDate: new Date(2026, 5, 3) }), src({ projectId: 'p3', startDate: null, endDate: null })],
      ['Cinematographer'], today,
    )
    expect(credits.map((c) => c.projectId)).toEqual(['p1', 'p2', 'p3'])
    expect(credits[0].production).toBe('ABC Studios')
  })
  it('uses the producer name when there is no production house', () => {
    expect(buildCredits([src({ productionHouse: null })], [], today)[0].production).toBe('Ravi')
  })
  it('current engagements are ongoing or upcoming only', () => {
    const credits = buildCredits([src(), src({ projectId: 'old', startDate: new Date(2026, 0, 1), endDate: new Date(2026, 0, 2) })], [], today)
    expect(currentEngagements(credits).map((c) => c.projectId)).toEqual(['p1'])
  })
})
