// Filtering for the Find Work page. Pure so the rules are unit-tested.
// Lists (roles, project types, hashtags) are multi-select: a project matches when it has ANY of
// the selected values. Different filters are combined with AND.

import { displayHashtags } from '@/lib/projectTags'
import { shootTimestamp } from '@/lib/projects/format'

export interface ProjectFilterState {
  roles: string[]
  projectTypes: string[]
  tags: string[]
  location: string
  dateRange: string // '' | this_week | next_week | this_month | next_month
}

export const EMPTY_PROJECT_FILTERS: ProjectFilterState = { roles: [], projectTypes: [], tags: [], location: '', dateRange: '' }

export interface FilterableProject {
  rolesNeeded: Array<string | { role: string }>
  projectType: string
  tags?: string[] | null
  location: string
  shootStartDate: string | null
}

const lower = (v: string) => v.toLowerCase()
const roleName = (r: string | { role: string }) => (typeof r === 'string' ? r : r?.role)
const typeParts = (t: string) => t.split(/[,/]+/).map((p) => p.trim()).filter(Boolean)

export function matchesDateRange(startDate: string | null, range: string, now: Date = new Date()): boolean {
  if (!range) return true
  // Projects without dates yet don't match a date filter.
  const ts = shootTimestamp(startDate)
  if (ts === null) return false
  const start = new Date(ts)
  const day = 24 * 60 * 60 * 1000
  switch (range) {
    case 'this_week':
      return start >= now && start <= new Date(now.getTime() + 7 * day)
    case 'next_week':
      return start >= new Date(now.getTime() + 7 * day) && start <= new Date(now.getTime() + 14 * day)
    case 'this_month':
      return start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear()
    case 'next_month': {
      const next = new Date(now.getFullYear(), now.getMonth() + 1)
      return start.getMonth() === next.getMonth() && start.getFullYear() === next.getFullYear()
    }
    default:
      return true
  }
}

export function filterProjects<T extends FilterableProject>(list: T[], f: ProjectFilterState, now: Date = new Date()): T[] {
  let out = list
  if (f.roles.length > 0) out = out.filter((p) => p.rolesNeeded.some((r) => f.roles.includes(roleName(r))))
  if (f.projectTypes.length > 0) out = out.filter((p) => typeParts(p.projectType).some((t) => f.projectTypes.includes(t)))
  if (f.tags.length > 0) {
    const wanted = new Set(f.tags.map((t) => lower(t.replace(/^#/, ''))))
    out = out.filter((p) => displayHashtags(p.projectType, p.tags).some((h) => wanted.has(lower(h.replace(/^#/, '')))))
  }
  if (f.location) {
    const q = lower(f.location)
    out = out.filter((p) => p.location.toLowerCase().includes(q))
  }
  if (f.dateRange) out = out.filter((p) => matchesDateRange(p.shootStartDate, f.dateRange, now))
  return out
}

export function activeProjectFilterCount(f: ProjectFilterState): number {
  return (f.roles.length ? 1 : 0) + (f.projectTypes.length ? 1 : 0) + (f.tags.length ? 1 : 0) + (f.location ? 1 : 0) + (f.dateRange ? 1 : 0)
}

export interface ProjectFilterChip {
  key: string
  label: string
  remove: (f: ProjectFilterState) => ProjectFilterState
}

const DATE_LABELS: Record<string, string> = { this_week: 'This week', next_week: 'Next week', this_month: 'This month', next_month: 'Next month' }

export function projectFilterChips(f: ProjectFilterState): ProjectFilterChip[] {
  const chips: ProjectFilterChip[] = []
  for (const v of f.roles) chips.push({ key: `role:${v}`, label: v, remove: (s) => ({ ...s, roles: s.roles.filter((x) => x !== v) }) })
  for (const v of f.projectTypes) chips.push({ key: `type:${v}`, label: v, remove: (s) => ({ ...s, projectTypes: s.projectTypes.filter((x) => x !== v) }) })
  for (const v of f.tags) chips.push({ key: `tag:${v}`, label: `#${v}`, remove: (s) => ({ ...s, tags: s.tags.filter((x) => x !== v) }) })
  if (f.location) chips.push({ key: 'location', label: f.location, remove: (s) => ({ ...s, location: '' }) })
  if (f.dateRange) chips.push({ key: 'date', label: DATE_LABELS[f.dateRange] ?? f.dateRange, remove: (s) => ({ ...s, dateRange: '' }) })
  return chips
}

// Filters from the URL: ?role=A,B &projectType=Ads &tag=Thriller &location= &dateRange=
export function projectFiltersFromParams(get: (name: string) => string | null): ProjectFilterState {
  const csv = (...names: string[]) => {
    const out: string[] = []
    for (const n of names) for (const part of (get(n) || '').split(',')) {
      const v = part.trim().replace(/^#/, '')
      if (v && !out.includes(v)) out.push(v)
    }
    return out
  }
  return {
    roles: csv('roles', 'role'),
    projectTypes: csv('projectTypes', 'projectType'),
    tags: csv('tags', 'tag'),
    location: get('location') || '',
    dateRange: get('dateRange') || '',
  }
}
