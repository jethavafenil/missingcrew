import { describe, it, expect } from 'vitest'
import { crewTags, matchScore, sanitizeCrewTags } from './matching'

describe('crewTags', () => {
  it('derives hashtags from project types, portfolio and own tags without duplicates', () => {
    const tags = crewTags({
      projectTypes: ['Feature Films', 'Ads'],
      pastProjects: [{ type: 'Web Series' }, { type: 'Ads' }, { title: 'no type' }],
      customTags: ['thriller', '#Night Shoot', 'ads'],
    })
    expect(tags).toEqual(['FeatureFilms', 'Ads', 'WebSeries', 'Thriller', 'NightShoot'])
  })
  it('tolerates missing data', () => {
    expect(crewTags({})).toEqual([])
    expect(crewTags({ pastProjects: 'x' })).toEqual([])
  })
})

describe('sanitizeCrewTags', () => {
  it('normalises, de-duplicates and caps at 5', () => {
    expect(sanitizeCrewTags(['a b', 'A B', '#x!', 'c', 'd', 'e', 'f'])).toEqual(['AB', 'X', 'C', 'D', 'E'])
  })
  it('ignores non-lists and non-strings', () => {
    expect(sanitizeCrewTags('x')).toEqual([])
    expect(sanitizeCrewTags([1, null, 'ok'])).toEqual(['Ok'])
  })
})

describe('matchScore', () => {
  const crew = { primaryRoles: ['Cinematographer'], projectTypes: ['Short Film'], city: 'Mumbai', dailyBudgetMin: 8000, dailyBudgetMax: 15000, customTags: ['Thriller'] }
  it('scores 100 for a perfect fit', () => {
    expect(matchScore(crew, { rolesNeeded: ['cinematographer'], projectType: 'Short Film', tags: ['thriller'], location: 'Mumbai, India', budgetMin: 10000, budgetMax: 20000 })).toBe(100)
  })
  it('drops the role points when the role is not needed', () => {
    expect(matchScore(crew, { rolesNeeded: ['Editor'], projectType: 'Short Film', location: 'Delhi' })).toBeLessThan(50)
  })
  it('is bounded 0-100 for empty input', () => {
    const s = matchScore({}, {})
    expect(s).toBeGreaterThanOrEqual(0)
    expect(s).toBeLessThanOrEqual(100)
  })
  it('penalises a budget the crew member is above', () => {
    const base = { rolesNeeded: ['Cinematographer'], projectType: 'Short Film', location: 'Mumbai' }
    expect(matchScore(crew, { ...base, budgetMax: 5000 })).toBe(matchScore(crew, { ...base, budgetMax: 20000 }) - 5)
  })
})
