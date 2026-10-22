// Verified production credits: every project a crew member was HIRED on through
// MissingCrew. Pure helpers so the rules (role fallback, ongoing/upcoming/completed,
// experience count) are unit-tested.

export type CreditStatus = 'ONGOING' | 'UPCOMING' | 'COMPLETED' | 'CONFIRMED'

export interface CreditSource {
  projectId: string
  projectName: string
  projectType: string
  productionHouse: string | null
  producerName: string | null
  location: string | null
  rolesNeeded: string[]
  startDate: Date | null
  endDate: Date | null
  // role agreed in the accepted hire request, when there was one
  hiredRole: string | null
}

export interface Credit {
  projectId: string
  projectName: string
  projectType: string
  role: string
  production: string | null
  location: string | null
  startDate: string | null
  endDate: string | null
  status: CreditStatus
}


function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

export function creditStatus(start: Date | null, end: Date | null, today: Date): CreditStatus {
  const t = startOfDay(today)
  const s = start ? startOfDay(start) : null
  const e = end ? startOfDay(end) : null
  if (s == null && e == null) return 'CONFIRMED'
  if (s != null && s > t) return 'UPCOMING'
  if (e != null) return e >= t ? 'ONGOING' : 'COMPLETED'
  // start in the past with no end date: cannot claim it is still running
  return 'COMPLETED'
}

// The role shown on the credit: the one agreed in the hire request, else the
// first role the project needed that the crew member offers, else their main role.
export function pickRole(hiredRole: string | null, rolesNeeded: string[], crewRoles: string[]): string {
  if (hiredRole && hiredRole.trim()) return hiredRole.trim()
  const lower = new Set(crewRoles.map((r) => r.toLowerCase()))
  const match = rolesNeeded.find((r) => lower.has(r.toLowerCase()))
  return match ?? crewRoles[0] ?? rolesNeeded[0] ?? 'Crew'
}

export function buildCredits(sources: CreditSource[], crewRoles: string[], today: Date = new Date()): Credit[] {
  const seen = new Set<string>()
  const credits: Credit[] = []
  for (const s of sources) {
    if (seen.has(s.projectId)) continue // one credit per project
    seen.add(s.projectId)
    credits.push({
      projectId: s.projectId,
      projectName: s.projectName,
      projectType: s.projectType,
      role: pickRole(s.hiredRole, s.rolesNeeded, crewRoles),
      production: s.productionHouse || s.producerName,
      location: s.location,
      startDate: s.startDate ? s.startDate.toISOString() : null,
      endDate: s.endDate ? s.endDate.toISOString() : null,
      status: creditStatus(s.startDate, s.endDate, today),
    })
  }
  // newest work first; undated credits last
  return credits.sort((a, b) => {
    const ad = a.startDate ? Date.parse(a.startDate) : -Infinity
    const bd = b.startDate ? Date.parse(b.startDate) : -Infinity
    return bd - ad
  })
}

export function currentEngagements(credits: Credit[]): Credit[] {
  return credits.filter((c) => c.status === 'ONGOING' || c.status === 'UPCOMING')
}

