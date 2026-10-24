import { describe, it, expect } from 'vitest'
import { pickMatchingCrew, type CrewCandidate } from './matchCrew'

const project = { projectType: 'Ads', rolesNeeded: ['Editor'], tags: ['Fashion'], location: 'Mumbai', budgetMin: 5000, budgetMax: 9000 }
const crew = (over: Partial<CrewCandidate> & { id: string }): CrewCandidate => ({
  userId: 'u' + over.id, primaryRoles: ['Editor'], projectTypes: ['Ads'], city: 'Mumbai', availability: true, dailyBudgetMin: 4000, dailyBudgetMax: 8000, customTags: [], ...over,
})

describe('pickMatchingCrew', () => {
  it('picks crew with the role plus type/city, best first', () => {
    const out = pickMatchingCrew(project, [crew({ id: 'a' }), crew({ id: 'b', city: 'Delhi' }), crew({ id: 'c', customTags: ['Fashion'] })])
    expect(out.map((m) => m.crew.id)).toEqual(['c', 'a', 'b'].filter((id) => out.some((m) => m.crew.id === id)))
    expect(out[0].crew.id).toBe('c')
    expect(out.every((m) => m.score >= 55)).toBe(true)
  })
  it('skips crew without the needed role even if everything else fits', () => {
    expect(pickMatchingCrew(project, [crew({ id: 'x', primaryRoles: ['Gaffer'] })])).toEqual([])
  })
  it('skips crew marked booked', () => {
    expect(pickMatchingCrew(project, [crew({ id: 'x', availability: false })])).toEqual([])
  })
  it('skips weak matches (role only)', () => {
    expect(pickMatchingCrew(project, [crew({ id: 'x', projectTypes: ['Documentary'], city: 'Pune', dailyBudgetMin: 50000, dailyBudgetMax: 60000 })])).toEqual([])
  })
})
