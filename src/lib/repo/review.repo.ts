import { getServiceClient } from '@/lib/repo/client'
import { now, throwOnError } from '@/lib/repo/helpers'

export const REVIEW_COLS = 'id,crew_id,employer_id,project_id,rating,comment,created_at,updated_at'

export interface ReviewView {
  id: string
  rating: number
  comment: string
  createdAt: string
  projectId: string
  projectName: string
  producerName: string
}

export interface EligibleProject {
  projectId: string
  projectName: string
  reviewed: boolean
  rating: number | null
  comment: string
}

type Raw = Record<string, any>

export async function listForCrew(crewId: string): Promise<ReviewView[]> {
  const { data, error } = await getServiceClient()
    .from('reviews')
    .select(`${REVIEW_COLS},project:projects(project_name),employer:employer_profiles(company_name,user:users(name))`)
    .eq('crew_id', crewId)
    .order('created_at', { ascending: false })
  throwOnError('review.listForCrew', error)
  return ((data ?? []) as unknown as Raw[]).map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment ?? '',
    createdAt: new Date(r.created_at).toISOString(),
    projectId: r.project_id,
    projectName: r.project?.project_name ?? 'a project',
    producerName: r.employer?.company_name || r.employer?.user?.name || 'A producer',
  }))
}

// Ratings only, for lists that show a star average per crew member.
export async function ratingsByCrew(crewIds: string[]): Promise<Map<string, number[]>> {
  const out = new Map<string, number[]>()
  if (crewIds.length === 0) return out
  const { data, error } = await getServiceClient().from('reviews').select('crew_id,rating').in('crew_id', crewIds)
  throwOnError('review.ratingsByCrew', error)
  for (const r of (data ?? []) as Array<{ crew_id: string; rating: number }>) {
    const list = out.get(r.crew_id) ?? []
    list.push(r.rating)
    out.set(r.crew_id, list)
  }
  return out
}

// Projects this producer hired the crew member on, with whether they already reviewed it.
export async function eligibleProjects(employerId: string, crewId: string): Promise<EligibleProject[]> {
  const db = getServiceClient()
  const [apps, reviews] = await Promise.all([
    db.from('applications').select('project_id,project:projects(project_name,employer_id)').eq('crew_id', crewId).eq('status', 'HIRED'),
    db.from('reviews').select('project_id,rating,comment').eq('crew_id', crewId).eq('employer_id', employerId),
  ])
  throwOnError('review.eligibleProjects', apps.error)
  throwOnError('review.eligibleProjects.reviews', reviews.error)
  const byProject = new Map(((reviews.data ?? []) as Array<{ project_id: string; rating: number; comment: string }>).map((r) => [r.project_id, r]))
  const out: EligibleProject[] = []
  for (const a of (apps.data ?? []) as unknown as Raw[]) {
    if (!a.project || a.project.employer_id !== employerId) continue
    const existing = byProject.get(a.project_id)
    out.push({ projectId: a.project_id, projectName: a.project.project_name, reviewed: !!existing, rating: existing?.rating ?? null, comment: existing?.comment ?? '' })
  }
  return out
}

// Create, or update the producer's own review of this project/crew pair.
export async function upsert(input: { crewId: string; employerId: string; projectId: string; rating: number; comment: string }): Promise<{ id: string; created: boolean }> {
  const db = getServiceClient()
  const { data: existing, error: findError } = await db.from('reviews').select('id').eq('project_id', input.projectId).eq('crew_id', input.crewId).maybeSingle()
  throwOnError('review.upsert.find', findError)
  if (existing) {
    const id = (existing as { id: string }).id
    const { error } = await db.from('reviews').update({ rating: input.rating, comment: input.comment, updated_at: now().toISOString() }).eq('id', id).eq('employer_id', input.employerId)
    throwOnError('review.upsert.update', error)
    return { id, created: false }
  }
  const { data, error } = await db
    .from('reviews')
    .insert({ crew_id: input.crewId, employer_id: input.employerId, project_id: input.projectId, rating: input.rating, comment: input.comment, created_at: now().toISOString(), updated_at: now().toISOString() })
    .select('id')
    .single()
  throwOnError('review.upsert.insert', error)
  return { id: (data as { id: string }).id, created: true }
}
