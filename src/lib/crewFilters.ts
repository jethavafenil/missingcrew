// Filtering for the browse-crew page. Pure so the rules are unit-tested.
// Lists (roles, project types, hashtags, genders) are multi-select: a crew member matches when
// they have ANY of the selected values. Different filters are combined with AND.

export interface CrewFilterState {
  roles: string[]
  location: string
  availability: string
  availableOn: string // YYYY-MM-DD: crew free on this day
  genders: string[] // MALE | FEMALE | OTHER
  experience: string
  budgetMin: string
  budgetMax: string
  languages: string[]
  hasPortfolio: boolean
  projectTypes: string[]
  tags: string[]
}

export const EMPTY_CREW_FILTERS: CrewFilterState = {
  roles: [],
  location: '',
  availability: '',
  availableOn: '',
  genders: [],
  experience: '',
  budgetMin: '',
  budgetMax: '',
  languages: [],
  hasPortfolio: false,
  projectTypes: [],
  tags: [],
}

export interface FilterableCrew {
  primaryRoles: string[]
  location?: string | null
  city?: string | null
  availability: boolean
  availabilityStart?: string | null
  availabilityEnd?: string | null
  yearsExperience?: string | null
  dailyBudgetMin?: number | null
  dailyBudgetMax?: number | null
  languages: string[]
  portfolioLinks?: string[] | null
  projectTypes: string[]
  tags?: string[] | null
  gender?: string | null
}

function utcDay(value: string | Date): number {
  const d = new Date(value)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

// Free on `day` (YYYY-MM-DD): marked available, and the day lies inside the stated window
// when there is one.
export function isAvailableOn(crew: Pick<FilterableCrew, 'availability' | 'availabilityStart' | 'availabilityEnd'>, day: string): boolean {
  if (!crew.availability) return false
  const t = Date.parse(`${day}T00:00:00Z`)
  if (Number.isNaN(t)) return true
  if (crew.availabilityStart && t < utcDay(crew.availabilityStart)) return false
  if (crew.availabilityEnd && t > utcDay(crew.availabilityEnd)) return false
  return true
}

const lower = (v: string) => v.toLowerCase()

export function filterCrew<T extends FilterableCrew>(list: T[], f: CrewFilterState): T[] {
  let out = list
  if (f.roles.length > 0) out = out.filter((c) => c.primaryRoles.some((r) => f.roles.includes(r)))
  if (f.location) {
    const q = lower(f.location)
    out = out.filter((c) => c.location?.toLowerCase().includes(q) || c.city?.toLowerCase().includes(q))
  }
  if (f.availability === 'available') out = out.filter((c) => c.availability)
  else if (f.availability === 'booked') out = out.filter((c) => !c.availability)
  if (f.availableOn) out = out.filter((c) => isAvailableOn(c, f.availableOn))
  if (f.genders.length > 0) out = out.filter((c) => !!c.gender && f.genders.includes(c.gender))
  if (f.experience) out = out.filter((c) => c.yearsExperience === f.experience)
  if (f.budgetMin) out = out.filter((c) => c.dailyBudgetMin && c.dailyBudgetMin >= parseInt(f.budgetMin))
  if (f.budgetMax) out = out.filter((c) => c.dailyBudgetMax && c.dailyBudgetMax <= parseInt(f.budgetMax))
  if (f.languages.length > 0) out = out.filter((c) => f.languages.every((l) => c.languages.includes(l)))
  if (f.hasPortfolio) out = out.filter((c) => c.portfolioLinks && c.portfolioLinks.length > 0)
  if (f.projectTypes.length > 0) out = out.filter((c) => c.projectTypes.some((t) => f.projectTypes.includes(t)))
  if (f.tags.length > 0) {
    const wanted = new Set(f.tags.map((t) => lower(t.replace(/^#/, ''))))
    out = out.filter((c) => (c.tags ?? []).some((t) => wanted.has(lower(t))))
  }
  return out
}

export function activeFilterCount(f: CrewFilterState): number {
  let n = 0
  if (f.roles.length) n++
  if (f.location) n++
  if (f.availability) n++
  if (f.availableOn) n++
  if (f.genders.length) n++
  if (f.experience) n++
  if (f.budgetMin || f.budgetMax) n++
  if (f.languages.length) n++
  if (f.hasPortfolio) n++
  if (f.projectTypes.length) n++
  if (f.tags.length) n++
  return n
}

// One removable chip per selected value, so filters can be undone with a single click.
export interface FilterChip {
  key: string
  label: string
  remove: (f: CrewFilterState) => CrewFilterState
}

export function filterChips(f: CrewFilterState): FilterChip[] {
  const chips: FilterChip[] = []
  const list = (field: 'roles' | 'genders' | 'projectTypes' | 'tags' | 'languages', fmt: (v: string) => string) => {
    for (const v of f[field]) chips.push({ key: `${field}:${v}`, label: fmt(v), remove: (s) => ({ ...s, [field]: s[field].filter((x) => x !== v) }) })
  }
  list('roles', (v) => v)
  list('tags', (v) => `#${v}`)
  list('projectTypes', (v) => v)
  list('genders', (v) => v.charAt(0) + v.slice(1).toLowerCase())
  list('languages', (v) => v)
  if (f.location) chips.push({ key: 'location', label: f.location, remove: (s) => ({ ...s, location: '' }) })
  if (f.availability) chips.push({ key: 'availability', label: f.availability === 'available' ? 'Available now' : 'Booked', remove: (s) => ({ ...s, availability: '' }) })
  if (f.availableOn) chips.push({ key: 'availableOn', label: `Free on ${f.availableOn}`, remove: (s) => ({ ...s, availableOn: '' }) })
  if (f.experience) chips.push({ key: 'experience', label: f.experience, remove: (s) => ({ ...s, experience: '' }) })
  if (f.budgetMin || f.budgetMax) chips.push({ key: 'budget', label: `₹${f.budgetMin || 0} - ${f.budgetMax ? '₹' + f.budgetMax : 'any'}`, remove: (s) => ({ ...s, budgetMin: '', budgetMax: '' }) })
  if (f.hasPortfolio) chips.push({ key: 'hasPortfolio', label: 'Has portfolio', remove: (s) => ({ ...s, hasPortfolio: false }) })
  return chips
}

// Filters from the URL (links such as /browse-crew?tag=Thriller or ?roles=Editor,Gaffer).
export function filtersFromParams(get: (name: string) => string | null): CrewFilterState {
  const csv = (...names: string[]) => {
    const out: string[] = []
    for (const n of names) for (const part of (get(n) || '').split(',')) {
      const v = part.trim().replace(/^#/, '')
      if (v && !out.includes(v)) out.push(v)
    }
    return out
  }
  return {
    ...EMPTY_CREW_FILTERS,
    roles: csv('roles', 'role'),
    location: get('location') || '',
    availability: get('availability') || '',
    availableOn: get('availableOn') || '',
    genders: csv('genders', 'gender').map((g) => g.toUpperCase()),
    experience: get('experience') || '',
    budgetMin: get('budgetMin') || '',
    budgetMax: get('budgetMax') || '',
    languages: csv('languages'),
    hasPortfolio: get('hasPortfolio') === 'true',
    projectTypes: csv('projectTypes', 'projectType'),
    tags: csv('tags', 'tag'),
  }
}

export function toggleIn(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value]
}
