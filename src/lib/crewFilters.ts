// Filtering for the browse-crew page. Pure so the rules are unit-tested.

export interface CrewFilterState {
  role: string
  location: string
  availability: string
  availableOn: string // YYYY-MM-DD: crew free on this day
  gender: string // MALE | FEMALE | OTHER | ''
  experience: string
  budgetMin: string
  budgetMax: string
  languages: string[]
  hasPortfolio: boolean
  projectType: string
  tag: string
}

export const EMPTY_CREW_FILTERS: CrewFilterState = {
  role: '',
  location: '',
  availability: '',
  availableOn: '',
  gender: '',
  experience: '',
  budgetMin: '',
  budgetMax: '',
  languages: [],
  hasPortfolio: false,
  projectType: '',
  tag: '',
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

export function filterCrew<T extends FilterableCrew>(list: T[], f: CrewFilterState): T[] {
  let out = list
  if (f.role) out = out.filter((c) => c.primaryRoles.includes(f.role))
  if (f.location) {
    const q = f.location.toLowerCase()
    out = out.filter((c) => c.location?.toLowerCase().includes(q) || c.city?.toLowerCase().includes(q))
  }
  if (f.availability === 'available') out = out.filter((c) => c.availability)
  else if (f.availability === 'booked') out = out.filter((c) => !c.availability)
  if (f.availableOn) out = out.filter((c) => isAvailableOn(c, f.availableOn))
  if (f.gender) out = out.filter((c) => c.gender === f.gender)
  if (f.experience) out = out.filter((c) => c.yearsExperience === f.experience)
  if (f.budgetMin) out = out.filter((c) => c.dailyBudgetMin && c.dailyBudgetMin >= parseInt(f.budgetMin))
  if (f.budgetMax) out = out.filter((c) => c.dailyBudgetMax && c.dailyBudgetMax <= parseInt(f.budgetMax))
  if (f.languages.length > 0) out = out.filter((c) => f.languages.every((l) => c.languages.includes(l)))
  if (f.hasPortfolio) out = out.filter((c) => c.portfolioLinks && c.portfolioLinks.length > 0)
  if (f.projectType) out = out.filter((c) => c.projectTypes.includes(f.projectType))
  if (f.tag) {
    const wanted = f.tag.replace(/^#/, '').toLowerCase()
    out = out.filter((c) => (c.tags ?? []).some((t) => t.toLowerCase() === wanted))
  }
  return out
}

export function activeFilterCount(f: CrewFilterState): number {
  let n = 0
  if (f.role) n++
  if (f.location) n++
  if (f.availability) n++
  if (f.availableOn) n++
  if (f.gender) n++
  if (f.experience) n++
  if (f.budgetMin || f.budgetMax) n++
  if (f.languages.length > 0) n++
  if (f.hasPortfolio) n++
  if (f.projectType) n++
  if (f.tag) n++
  return n
}
