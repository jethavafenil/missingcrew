import { describe, it, expect } from 'vitest'
import { activeFilterCount, EMPTY_CREW_FILTERS, filterCrew, isAvailableOn, type FilterableCrew } from './crewFilters'

const base: FilterableCrew = { primaryRoles: ['Editor'], city: 'Mumbai', availability: true, languages: ['Hindi'], projectTypes: ['Ads'], tags: ['Ads', 'Thriller'], gender: 'FEMALE', dailyBudgetMin: 5000, dailyBudgetMax: 9000 }
const crew = [
  { ...base, id: 1 },
  { ...base, id: 2, primaryRoles: ['DOP'], city: 'Delhi', gender: 'MALE', availability: false, tags: [] },
  { ...base, id: 3, availabilityStart: '2026-12-01T00:00:00Z', availabilityEnd: '2026-12-20T00:00:00Z', gender: null },
]
const f = (over = {}) => ({ ...EMPTY_CREW_FILTERS, ...over })
const ids = (l: Array<{ id: number }>) => l.map((c) => c.id)

describe('filterCrew', () => {
  it('returns everyone with empty filters', () => {
    expect(ids(filterCrew(crew, f()))).toEqual([1, 2, 3])
  })
  it('filters by profession, city, gender and tag', () => {
    expect(ids(filterCrew(crew, f({ role: 'DOP' })))).toEqual([2])
    expect(ids(filterCrew(crew, f({ location: 'mumb' })))).toEqual([1, 3])
    expect(ids(filterCrew(crew, f({ gender: 'MALE' })))).toEqual([2])
    expect(ids(filterCrew(crew, f({ tag: '#thriller' })))).toEqual([1, 3])
  })
  it('filters by availability on a date', () => {
    expect(ids(filterCrew(crew, f({ availableOn: '2026-12-10' })))).toEqual([1, 3])
    expect(ids(filterCrew(crew, f({ availableOn: '2027-01-05' })))).toEqual([1])
    expect(ids(filterCrew(crew, f({ availableOn: '2026-11-30' })))).toEqual([1])
  })
  it('keeps the existing availability and budget filters', () => {
    expect(ids(filterCrew(crew, f({ availability: 'booked' })))).toEqual([2])
    expect(ids(filterCrew(crew, f({ budgetMin: '6000' })))).toEqual([])
  })
})

describe('isAvailableOn', () => {
  it('includes the first and last day of the window', () => {
    const c = { availability: true, availabilityStart: '2026-12-01T10:00:00Z', availabilityEnd: '2026-12-20T10:00:00Z' }
    expect(isAvailableOn(c, '2026-12-01')).toBe(true)
    expect(isAvailableOn(c, '2026-12-20')).toBe(true)
    expect(isAvailableOn(c, '2026-12-21')).toBe(false)
  })
  it('is false when marked booked', () => {
    expect(isAvailableOn({ availability: false }, '2026-12-01')).toBe(false)
  })
})

describe('activeFilterCount', () => {
  it('counts budget once and each other filter', () => {
    expect(activeFilterCount(f({ budgetMin: '1', budgetMax: '2', tag: 'x', gender: 'MALE' }))).toBe(3)
  })
})
