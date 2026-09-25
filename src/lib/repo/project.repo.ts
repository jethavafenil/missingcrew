import { getServiceClient } from '@/lib/repo/client'
import { now, throwOnError, iso } from '@/lib/repo/helpers'
import {
  mapProject,
  mapEmployerProfile,
  mapApplication,
  mapCrewProfile,
  mapUser,
  type ProjectRow,
  type ProjectWithEmployerRow,
  type EmployerProfileWithUserRow,
  type ApplicationWithCrewRow,
  type ProjectStatus,
} from '@/lib/repo/types'
import type { Requester } from '@/lib/repo/types'

export const PROJECT_COLS =
  'id,employer_id,project_name,project_type,roles_needed,shoot_start_date,shoot_end_date,location,budget_per_role,description,questions,contact_preference,status,created_at,updated_at'

export const PROJECT_WITH_EMPLOYER = `${PROJECT_COLS},employer:employer_profiles(id,"userId",company_name,company_website,completed,created_at,updated_at,user:users(id,name,email,image,phone,"phoneVerified"))`

function toEmployerWithUser(raw: Record<string, unknown>): EmployerProfileWithUserRow {
  const ep = mapEmployerProfile(raw)
  const u = raw.user ? mapUser(raw.user as Record<string, unknown>) : undefined
  return {
    ...ep,
    user: u
      ? { name: u.name, image: u.image, email: u.email }
      : undefined,
  }
}

export function toProjectWithEmployer(raw: Record<string, unknown>): ProjectWithEmployerRow {
  const p = mapProject(raw)
  const employerRaw = raw.employer as Record<string, unknown> | null | undefined
  const appsRaw = raw.applications as Array<Record<string, unknown>> | null | undefined
  const out: ProjectWithEmployerRow = { ...p, employer: employerRaw ? toEmployerWithUser(employerRaw) : undefined }
  if (appsRaw) {
    out.applications = appsRaw.map((a) => {
      const app = mapApplication(a)
      const crewRaw = a.crew as Record<string, unknown> | null | undefined
      const c: ApplicationWithCrewRow = { ...app }
      if (crewRaw) {
        const crew = mapCrewProfile(crewRaw)
        c.crew = { ...crew, user: crewRaw.user ? mapUser(crewRaw.user as Record<string, unknown>) : undefined }
      }
      return c
    })
  }
  return out
}

export interface ProjectFilters {
  status?: ProjectStatus
  location?: string
  search?: string
  onlyOpen?: boolean
  crewId?: string
  take?: number
  skip?: number
}

export async function findMany(filters: ProjectFilters = {}): Promise<ProjectWithEmployerRow[]> {
  let q = getServiceClient()
    .from('projects')
    .select(`${PROJECT_WITH_EMPLOYER},applications(id)`)
    .order('created_at', { ascending: false })
  if (filters.status) q = q.eq('status', filters.status)
  if (filters.onlyOpen) q = q.eq('status', 'OPEN')
  if (filters.location) q = q.ilike('location', `%${filters.location}%`)
  if (filters.search) {
    q = q.or(`project_name.ilike.%${filters.search}%,location.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }
  if (filters.take) {
    const skip = filters.skip ?? 0
    q = q.range(skip, skip + filters.take - 1)
  }
  const { data, error } = await q
  throwOnError('project.findMany', error)
  return (data ?? []).map((r) => {
    const p = toProjectWithEmployer(r as Record<string, unknown>)
    const apps = (r as Record<string, unknown>).applications as Array<Record<string, unknown>> | null | undefined
    p._count = { applications: apps?.length ?? 0 }
    return p
  })
}

export async function findById(id: string): Promise<ProjectWithEmployerRow | null> {
  const { data, error } = await getServiceClient()
    .from('projects')
    .select(`${PROJECT_WITH_EMPLOYER},applications(id)`)
    .eq('id', id)
    .maybeSingle()
  throwOnError('project.findById', error)
  return data ? toProjectWithCount(data as Record<string, unknown>) : null
}

function toProjectWithCount(raw: Record<string, unknown>): ProjectWithEmployerRow {
  const p = toProjectWithEmployer(raw)
  const apps = raw.applications as Array<Record<string, unknown>> | null | undefined
  p._count = { applications: apps?.length ?? 0 }
  return p
}

// Slug resolution (api/projects/[id]): exact case-insensitive projectName match.
// `ilike` without wildcards == case-insensitive equals.
export async function findFirstByProjectNameExact(name: string): Promise<ProjectWithEmployerRow | null> {
  const { data, error } = await getServiceClient()
    .from('projects')
    .select(`${PROJECT_WITH_EMPLOYER},applications(id)`)
    .ilike('project_name', name)
    .limit(1)
    .maybeSingle()
  throwOnError('project.findFirstByProjectNameExact', error)
  return data ? toProjectWithCount(data as Record<string, unknown>) : null
}

// Slug resolution fallback: every word must appear in projectName
// (case-insensitive contains); repeated filters on the same column AND.
export async function findFirstByProjectNameContainsAll(words: string[]): Promise<ProjectWithEmployerRow | null> {
  let q = getServiceClient().from('projects').select(`${PROJECT_WITH_EMPLOYER},applications(id)`)
  for (const w of words) q = q.ilike('project_name', `%${w}%`)
  const { data, error } = await q.limit(1).maybeSingle()
  throwOnError('project.findFirstByProjectNameContainsAll', error)
  return data ? toProjectWithCount(data as Record<string, unknown>) : null
}

export async function findByIdRaw(id: string): Promise<ProjectRow | null> {
  const { data, error } = await getServiceClient().from('projects').select(PROJECT_COLS).eq('id', id).maybeSingle()
  throwOnError('project.findByIdRaw', error)
  return data ? mapProject(data as Record<string, unknown>) : null
}

// Ownership-scoped lookup (api/employer/projects/[id]): project must belong
// to the given employer profile.
export async function findByIdAndEmployerId(id: string, employerId: string): Promise<ProjectRow | null> {
  const { data, error } = await getServiceClient()
    .from('projects')
    .select(PROJECT_COLS)
    .eq('id', id)
    .eq('employer_id', employerId)
    .maybeSingle()
  throwOnError('project.findByIdAndEmployerId', error)
  return data ? mapProject(data as Record<string, unknown>) : null
}

export interface CreateProjectInput {
  employerId: string
  projectName: string
  projectType: string
  rolesNeeded: string[]
  shootStartDate: Date | string
  shootEndDate: Date | string
  location: string
  budgetPerRole?: unknown | null
  description: string
  questions: Record<string, unknown> | string[]
  contactPreference: Record<string, unknown> | string[]
  status?: ProjectStatus
}

export async function create(input: CreateProjectInput, _req: Requester): Promise<ProjectRow> {
  const { data, error } = await getServiceClient()
    .from('projects')
    .insert({
      employer_id: input.employerId,
      project_name: input.projectName,
      project_type: input.projectType,
      roles_needed: input.rolesNeeded,
      shoot_start_date: iso(input.shootStartDate),
      shoot_end_date: iso(input.shootEndDate),
      location: input.location,
      budget_per_role: input.budgetPerRole ?? null,
      description: input.description,
      questions: input.questions,
      contact_preference: input.contactPreference,
      status: input.status ?? 'OPEN',
      created_at: now().toISOString(),
      updated_at: now().toISOString(),
    })
    .select(PROJECT_COLS)
    .single()
  throwOnError('project.create', error)
  return mapProject(data as Record<string, unknown>)
}

export interface UpdateProjectInput {
  projectName?: string
  projectType?: string
  rolesNeeded?: string[]
  shootStartDate?: Date | string
  shootEndDate?: Date | string
  location?: string
  budgetPerRole?: unknown | null
  description?: string
  questions?: Record<string, unknown> | string[]
  contactPreference?: Record<string, unknown> | string[]
  status?: ProjectStatus
}

export async function update(id: string, input: UpdateProjectInput, _req: Requester): Promise<ProjectRow | null> {
  const patch: Record<string, unknown> = { updated_at: now().toISOString() }
  if (input.projectName !== undefined) patch.project_name = input.projectName
  if (input.projectType !== undefined) patch.project_type = input.projectType
  if (input.rolesNeeded !== undefined) patch.roles_needed = input.rolesNeeded
  if (input.shootStartDate !== undefined) patch.shoot_start_date = iso(input.shootStartDate)
  if (input.shootEndDate !== undefined) patch.shoot_end_date = iso(input.shootEndDate)
  if (input.location !== undefined) patch.location = input.location
  if (input.budgetPerRole !== undefined) patch.budget_per_role = input.budgetPerRole
  if (input.description !== undefined) patch.description = input.description
  if (input.questions !== undefined) patch.questions = input.questions
  if (input.contactPreference !== undefined) patch.contact_preference = input.contactPreference
  if (input.status !== undefined) patch.status = input.status
  const { data, error } = await getServiceClient()
    .from('projects')
    .update(patch)
    .eq('id', id)
    .select(PROJECT_COLS)
    .maybeSingle()
  throwOnError('project.update', error)
  return data ? mapProject(data as Record<string, unknown>) : null
}

export async function findManyByEmployerId(employerId: string, _req: Requester): Promise<ProjectWithEmployerRow[]> {
  const { data, error } = await getServiceClient()
    .from('projects')
    .select(`${PROJECT_WITH_EMPLOYER},applications(*,crew:crew_profiles(id,"userId",photo,city,budget_range_min,budget_range_max,"budgetFlexible",primary_roles,years_experience,location,available_to_travel,availability,availability_start,availability_end,project_types,daily_budget_min,daily_budget_max,languages,imdb_link,portfolio_links,past_projects,referred_by,contact_whatsapp,terms_agreed,subscription_tier,trial_ends,completed,created_at,updated_at,user:users(id,name,email,phone,"phoneVerified")))`)
    .eq('employer_id', employerId)
    .order('created_at', { ascending: false })
  throwOnError('project.findManyByEmployerId', error)
  return (data ?? []).map((r) => toProjectWithEmployer(r as Record<string, unknown>))
}

export async function countAll(_req: Requester): Promise<number> {
  const { count, error } = await getServiceClient().from('projects').select('id', { count: 'exact', head: true })
  throwOnError('project.count', error)
  return count ?? 0
}

export async function countByStatus(status: ProjectStatus, _req: Requester): Promise<number> {
  const { count, error } = await getServiceClient()
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('status', status)
  throwOnError('project.countByStatus', error)
  return count ?? 0
}

export async function countCreatedSince(since: Date, _req: Requester): Promise<number> {
  const { count, error } = await getServiceClient()
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', since.toISOString())
  throwOnError('project.countCreatedSince', error)
  return count ?? 0
}

// Admin listing: all projects with employer info and application counts, newest first
export async function findManyAdminWithCounts(
  _req: Requester & { role: 'ADMIN' }
): Promise<Array<ProjectRow & { employer?: EmployerProfileWithUserRow; _count: { applications: number } }>> {
  const { data, error } = await getServiceClient()
    .from('projects')
    .select(`${PROJECT_WITH_EMPLOYER},applications(id)`)
    .order('created_at', { ascending: false })
  throwOnError('project.findManyAdminWithCounts', error)
  return (data ?? []).map((r) => {
    const raw = r as Record<string, unknown>
    const employerRaw = raw.employer as Record<string, unknown> | null | undefined
    const apps = raw.applications as Array<Record<string, unknown>> | null | undefined
    return {
      ...mapProject(raw),
      employer: employerRaw ? toEmployerWithUser(employerRaw) : undefined,
      _count: { applications: apps?.length ?? 0 },
    }
  })
}

export async function remove(id: string, _req: Requester): Promise<void> {
  const { error } = await getServiceClient().from('projects').delete().eq('id', id)
  throwOnError('project.remove', error)
}

export type { ProjectRow, ProjectWithEmployerRow, ProjectStatus }