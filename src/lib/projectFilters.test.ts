import { describe, it, expect } from 'vitest'
import { EMPTY_PROJECT_FILTERS, activeProjectFilterCount, filterProjects, matchesDateRange, projectFilterChips, projectFiltersFromParams, type FilterableProject } from './projectFilters'

const now = new Date(2026, 9, 27, 12)
const day = 86400000
const mk = (id: number, over: Partial<FilterableProject> = {}) => ({ id, rolesNeeded: ['Editor'], projectType: 'Ads', tags: [] as string[], location: 'Mumbai', shootStartDate: new Date(now.getTime() + 2 * day).toISOString(), ...over })
const projects = [
  mk(1),
  mk(2, { rolesNeeded: ['DOP', 'Gaffer'], projectType: 'Web Series', tags: ['Thriller'], location: 'Delhi' }),
  mk(3, { rolesNeeded: [{ role: 'Sound Recordist' }], projectType: 'Short Film', tags: ['Comedy', 'Drama'], shootStartDate: null }),
]
const f = (over = {}) => ({ ...EMPTY_PROJECT_FILTERS, ...over })
const ids = (l: Array<{ id: number }>) => l.map((p) => p.id)

describe('filterProjects', () => {
  it('returns all with no filters', () => {
    expect(ids(filterProjects(projects, f(), now))).toEqual([1, 2, 3])
  })
  it('multi-select lists match ANY value', () => {
    expect(ids(filterProjects(projects, f({ roles: ['Editor', 'Gaffer'] }), now))).toEqual([1, 2])
    expect(ids(filterProjects(projects, f({ roles: ['Sound Recordist'] }), now))).toEqual([3])
    expect(ids(filterProjects(projects, f({ projectTypes: ['Ads', 'Short Film'] }), now))).toEqual([1, 3])
    expect(ids(filterProjects(projects, f({ tags: ['thriller', '#Drama'] }), now))).toEqual([2, 3])
  })
  it('project type counts as a hashtag too', () => {
    expect(ids(filterProjects(projects, f({ tags: ['WebSeries'] }), now))).toEqual([2])
  })
  it('different filters combine with AND', () => {
    expect(ids(filterProjects(projects, f({ roles: ['Editor', 'DOP'], location: 'delhi' }), now))).toEqual([2])
  })
  it('date ranges skip projects without dates', () => {
    expect(ids(filterProjects(projects, f({ dateRange: 'this_week' }), now))).toEqual([1, 2])
  })
})

describe('matchesDateRange', () => {
  it('handles weeks and months', () => {
    expect(matchesDateRange(new Date(now.getTime() + 9 * day).toISOString(), 'next_week', now)).toBe(true)
    expect(matchesDateRange(new Date(now.getTime() + 2 * day).toISOString(), 'next_week', now)).toBe(false)
    expect(matchesDateRange(new Date(2026, 10, 15).toISOString(), 'next_month', now)).toBe(true)
  })
})

describe('chips, count and URL', () => {
  it('counts each filter group once', () => {
    expect(activeProjectFilterCount(f({ roles: ['a', 'b'], tags: ['x'], location: 'y' }))).toBe(3)
  })
  it('one removable chip per value', () => {
    const s = f({ roles: ['Editor', 'DOP'], projectTypes: ['Ads'] })
    const chips = projectFilterChips(s)
    expect(chips.map((c) => c.label)).toEqual(['Editor', 'DOP', 'Ads'])
    expect(chips[1].remove(s).roles).toEqual(['Editor'])
  })
  it('reads single and list URL params', () => {
    const p = new URLSearchParams('role=Editor,Gaffer&projectType=Ads&tag=%23Thriller&dateRange=this_week')
    const s = projectFiltersFromParams((n) => p.get(n))
    expect(s).toEqual({ roles: ['Editor', 'Gaffer'], projectTypes: ['Ads'], tags: ['Thriller'], location: '', dateRange: 'this_week' })
  })
})
