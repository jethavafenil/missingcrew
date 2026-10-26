import { describe, it, expect } from 'vitest'
import { activeFilterCount, EMPTY_CREW_FILTERS, filterChips, filterCrew, filtersFromParams, isAvailableOn, toggleIn, type FilterableCrew } from './crewFilters'

const base: FilterableCrew = { primaryRoles: ['Editor'], city: 'Mumbai', availability: true, languages: ['Hindi'], projectTypes: ['Ads'], tags: ['Ads', 'Thriller'], gender: 'FEMALE', dailyBudgetMin: 5000, dailyBudgetMax: 9000 }
const crew = [
  { ...base, id: 1 },
  { ...base, id: 2, primaryRoles: ['DOP'], city: 'Delhi', gender: 'MALE', availability: false, tags: [], projectTypes: ['Short Film'] },
  { ...base, id: 3, primaryRoles: ['Gaffer'], availabilityStart: '2026-12-01T00:00:00Z', availabilityEnd: '2026-12-20T00:00:00Z', gender: null, tags: ['Comedy'] },
]
const f = (over = {}) => ({ ...EMPTY_CREW_FILTERS, ...over })
const ids = (l: Array<{ id: number }>) => l.map((c) => c.id)

describe('filterCrew', () => {
  it('returns everyone with empty filters', () => {
    expect(ids(filterCrew(crew, f()))).toEqual([1, 2, 3])
  })
  it('multi-select lists match ANY selected value', () => {
    expect(ids(filterCrew(crew, f({ roles: ['DOP', 'Gaffer'] })))).toEqual([2, 3])
    expect(ids(filterCrew(crew, f({ tags: ['thriller', '#Comedy'] })))).toEqual([1, 3])
    expect(ids(filterCrew(crew, f({ projectTypes: ['Ads', 'Short Film'] })))).toEqual([1, 2, 3])
    expect(ids(filterCrew(crew, f({ genders: ['MALE', 'FEMALE'] })))).toEqual([1, 2])
  })
  it('different filters combine with AND', () => {
    expect(ids(filterCrew(crew, f({ roles: ['Editor', 'DOP'], genders: ['MALE'] })))).toEqual([2])
    expect(ids(filterCrew(crew, f({ location: 'mumb', tags: ['Comedy'] })))).toEqual([3])
  })
  it('filters by availability on a date', () => {
    expect(ids(filterCrew(crew, f({ availableOn: '2026-12-10' })))).toEqual([1, 3])
    expect(ids(filterCrew(crew, f({ availableOn: '2027-01-05' })))).toEqual([1])
    expect(ids(filterCrew(crew, f({ availableOn: '2026-11-30' })))).toEqual([1])
  })
  it('keeps the availability and budget filters', () => {
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

describe('chips, count and URL', () => {
  it('counts each filter once and budget once', () => {
    expect(activeFilterCount(f({ budgetMin: '1', budgetMax: '2', tags: ['a', 'b'], genders: ['MALE'] }))).toBe(3)
  })
  it('makes one removable chip per selected value', () => {
    const state = f({ roles: ['Editor', 'DOP'], tags: ['Thriller'] })
    const chips = filterChips(state)
    expect(chips.map((c) => c.label)).toEqual(['Editor', 'DOP', '#Thriller'])
    expect(chips[0].remove(state).roles).toEqual(['DOP'])
  })
  it('reads single and list URL params', () => {
    const p = new URLSearchParams('tag=%23Thriller&roles=Editor,Gaffer&gender=female&projectType=Ads')
    const s = filtersFromParams((n) => p.get(n))
    expect(s.tags).toEqual(['Thriller'])
    expect(s.roles).toEqual(['Editor', 'Gaffer'])
    expect(s.genders).toEqual(['FEMALE'])
    expect(s.projectTypes).toEqual(['Ads'])
  })
  it('toggles values in a list', () => {
    expect(toggleIn(['a'], 'b')).toEqual(['a', 'b'])
    expect(toggleIn(['a', 'b'], 'a')).toEqual(['b'])
  })
})
