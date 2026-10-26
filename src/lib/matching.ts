// Tags and match score shared by crew profiles, project cards and the split-screen
// applicant review. Everything is derived from data we already store, so crew do not
// have to maintain tags by hand: project types from their portfolio become hashtags.

import { normalizeTag, normalizeTags, pickPremade, typeTag } from '@/lib/projectTags'

export const MAX_CREW_TAGS = 5

export interface TaggableCrew {
  projectTypes?: string[] | null
  primaryRoles?: string[] | null
  customTags?: string[] | null
  pastProjects?: unknown
}

export interface MatchableCrew extends TaggableCrew {
  city?: string | null
  location?: string | null
  dailyBudgetMin?: number | null
  dailyBudgetMax?: number | null
  budgetFlexible?: boolean | null
}

export interface MatchableProject {
  projectType?: string | null
  rolesNeeded?: string[] | null
  tags?: string[] | null
  location?: string | null
  budgetMin?: number | null
  budgetMax?: number | null
}

function pastProjectTypes(pastProjects: unknown): string[] {
  if (!Array.isArray(pastProjects)) return []
  const out: string[] = []
  for (const p of pastProjects) {
    if (p && typeof p === 'object' && typeof (p as { type?: unknown }).type === 'string') out.push((p as { type: string }).type)
  }
  return out
}

function splitTypes(value?: string | null): string[] {
  return (value || '').split(/[,/]+/).map((v) => v.trim()).filter(Boolean)
}

// Hashtags for a crew profile: project types (declared + from portfolio) first, then
// their own tags. No '#', CamelCase, de-duplicated.
export function crewTags(crew: TaggableCrew): string[] {
  const types = [...(crew.projectTypes ?? []), ...pastProjectTypes(crew.pastProjects)].map(typeTag)
  return normalizeTags([...types, ...pickPremade(crew.customTags)])
}

// Crew-chosen tags: premade list only, no duplicates, capped.
export function sanitizeCrewTags(list: unknown): string[] {
  return pickPremade(list).slice(0, MAX_CREW_TAGS)
}

const lc = (v: string) => v.toLowerCase().trim()

function overlap(a: string[], b: string[]): number {
  const set = new Set(a.map(lc))
  return b.filter((x) => set.has(lc(x))).length
}

function cityOf(value?: string | null): string {
  return lc((value || '').split(',')[0] || '')
}

export function hasRoleOverlap(crewRoles: string[] | null | undefined, needed: string[] | null | undefined): boolean {
  return overlap(crewRoles ?? [], needed ?? []) > 0
}

// 0-100 fit between a crew member and a project:
// role 40, project type 25, tags 15, city 15, budget 5.
export function matchScore(crew: MatchableCrew, project: MatchableProject): number {
  let score = 0

  const needed = project.rolesNeeded ?? []
  if (needed.length === 0) score += 20
  else if (overlap(crew.primaryRoles ?? [], needed) > 0) score += 40

  const types = splitTypes(project.projectType).map(typeTag)
  if (types.length === 0) score += 12
  else {
    const mine = [...(crew.projectTypes ?? []), ...pastProjectTypes(crew.pastProjects)].map(typeTag)
    if (overlap(mine, types) > 0) score += 25
  }

  const projTags = (project.tags ?? []).map(normalizeTag).filter(Boolean)
  if (projTags.length > 0 && overlap(crewTags(crew), projTags) > 0) score += 15

  const pc = cityOf(project.location)
  const cc = cityOf(crew.city || crew.location)
  if (pc && cc && (pc === cc || pc.includes(cc) || cc.includes(pc))) score += 15

  const crewMax = crew.dailyBudgetMax ?? crew.dailyBudgetMin ?? null
  const projMax = project.budgetMax ?? project.budgetMin ?? null
  if (crewMax == null || projMax == null || crew.budgetFlexible || (crew.dailyBudgetMin ?? 0) <= projMax) score += 5

  return Math.max(0, Math.min(100, Math.round(score)))
}
