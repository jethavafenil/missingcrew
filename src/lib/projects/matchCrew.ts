// Which crew should hear about a newly posted project: they offer one of the needed roles,
// are not marked booked, and the overall match (role, project type, hashtags, city, budget)
// reaches the threshold. Pure so the rule is unit-tested.

import { hasRoleOverlap, matchScore, type MatchableCrew, type MatchableProject } from '@/lib/matching'

export const MATCH_THRESHOLD = 55
export const MAX_MATCH_NOTIFICATIONS = 300

export interface CrewCandidate extends MatchableCrew {
  id: string
  userId: string
  primaryRoles?: string[] | null
  availability?: boolean | null
}

export function pickMatchingCrew<T extends CrewCandidate>(project: MatchableProject, crew: T[], threshold = MATCH_THRESHOLD): Array<{ crew: T; score: number }> {
  const needed = project.rolesNeeded ?? []
  return crew
    .filter((c) => c.availability !== false && (needed.length === 0 || hasRoleOverlap(c.primaryRoles, needed)))
    .map((c) => ({ crew: c, score: matchScore(c, project) }))
    .filter((m) => m.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_MATCH_NOTIFICATIONS)
}
