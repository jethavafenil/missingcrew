// How complete a crew profile is, and exactly which items are still missing.
// One list drives the percentage on the dashboard and the "Complete your profile" screen, so the
// screen asks for exactly what is left and nothing else.

export type CompletionKey =
  | 'photo'
  | 'city'
  | 'roles'
  | 'experience'
  | 'availability'
  | 'travel'
  | 'availStart'
  | 'availEnd'
  | 'whatsapp'
  | 'imdb'
  | 'links'
  | 'types'

export interface CompletionInput {
  photo?: string | null
  city?: string | null
  primaryRoles?: string[] | null
  yearsExperience?: string | null
  availability?: boolean | null
  availableToTravel?: boolean | null
  availabilityStart?: string | Date | null
  availabilityEnd?: string | Date | null
  contactWhatsApp?: string | null
  imdbLink?: string | null
  portfolioLinks?: unknown[] | null
  projectTypes?: string[] | null
}

const filled = (v: unknown) => (typeof v === 'string' ? v.trim().length > 0 : v != null && v !== false)
const list = (v: unknown[] | null | undefined) => Array.isArray(v) && v.length > 0

export const COMPLETION_LABELS: Record<CompletionKey, string> = {
  photo: 'Profile photo',
  city: 'City',
  roles: 'Primary roles',
  experience: 'Years of experience',
  availability: 'Availability',
  travel: 'Willing to travel',
  availStart: 'Available from',
  availEnd: 'Available until',
  whatsapp: 'WhatsApp number',
  imdb: 'IMDb profile link',
  links: 'A portfolio link',
  types: 'Project types you work on',
}

export const COMPLETION_TOTAL = Object.keys(COMPLETION_LABELS).length

export function profileCompletion(p: CompletionInput | null | undefined): { percent: number; missing: CompletionKey[] } {
  if (!p) return { percent: 0, missing: Object.keys(COMPLETION_LABELS) as CompletionKey[] }
  const checks: Array<[CompletionKey, boolean]> = [
    ['photo', filled(p.photo)],
    ['city', filled(p.city)],
    ['roles', list(p.primaryRoles)],
    ['experience', filled(p.yearsExperience)],
    // yes/no answers count once they are set (they are always set on a saved profile)
    ['availability', p.availability != null],
    ['travel', p.availableToTravel != null],
    ['availStart', filled(p.availabilityStart)],
    ['availEnd', filled(p.availabilityEnd)],
    ['whatsapp', filled(p.contactWhatsApp)],
    ['imdb', filled(p.imdbLink)],
    ['links', list(p.portfolioLinks)],
    ['types', list(p.projectTypes)],
  ]
  const missing = checks.filter(([, ok]) => !ok).map(([k]) => k)
  return { percent: Math.round(((COMPLETION_TOTAL - missing.length) / COMPLETION_TOTAL) * 100), missing }
}
