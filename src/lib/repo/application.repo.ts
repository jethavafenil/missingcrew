import { getServiceClient } from '@/lib/repo/client'
import { now, throwOnError } from '@/lib/repo/helpers'
import {
  mapApplication,
  mapProject,
  mapEmployerProfile,
  mapCrewProfile,
  mapUser,
  type ApplicationRow,
  type ApplicationWithProjectAndCrewRow,
  type ApplicationWithCrewRow,
  type ApplicationStatus,
} from '@/lib/repo/types'
import type { Requester } from '@/lib/repo/types'

export const APP_COLS = 'id,project_id,crew_id,status,applied_at,employer_notes,crew_notes,answers'

const APP_WITH_CREW = `${APP_COLS},crew:crew_profiles(id,"userId",photo,city,budget_range_min,budget_range_max,"budgetFlexible",primary_roles,years_experience,location,available_to_travel,availability,availability_start,availability_end,project_types,daily_budget_min,daily_budget_max,languages,imdb_link,portfolio_links,past_projects,referred_by,contact_whatsapp,terms_agreed,subscription_tier,trial_ends,completed,created_at,updated_at,user:users(id,name,email,phone,"phoneVerified"))`

const APP_WITH_PROJECT_CREW = `${APP_COLS},project:projects(*,employer:employer_profiles(id,"userId",company_name,company_website,completed,created_at,updated_at,user:users(id,name,email,image,phone,"phoneVerified")),applications(id)),crew:crew_profiles(*,user:users(id,name,email,phone,"phoneVerified"))`

function toCrewWithUser(raw: Record<string, unknown>) {
  const crew = mapCrewProfile(raw)
  return { ...crew, user: raw.user ? mapUser(raw.user as Record<string, unknown>) : undefined }
}

function toProjectWithEmployer(raw: Record<string, unknown>) {
  const p = mapProject(raw)
  const employerRaw = raw.employer as Record<string, unknown> | null | undefined
  const apps = raw.applications as Array<Record<string, unknown>> | null | undefined
  return {
    ...p,
    employer: employerRaw ? toEmployerWithUser(employerRaw) : undefined,
    _count: { applications: apps?.length ?? 0 },
  }
}

function toEmployerWithUser(raw: Record<string, unknown>) {
  const ep = mapEmployerProfile(raw)
  const u = raw.user ? mapUser(raw.user as Record<string, unknown>) : undefined
  return {
    ...ep,
    user: u ? { name: u.name, image: u.image, email: u.email } : undefined,
  }
}

function toAppWithCrew(raw: Record<string, unknown>): ApplicationWithCrewRow {
  const app = mapApplication(raw)
  const crewRaw = raw.crew as Record<string, unknown> | null | undefined
  return { ...app, crew: crewRaw ? toCrewWithUser(crewRaw) : undefined }
}

function toAppWithProjectAndCrew(raw: Record<string, unknown>): ApplicationWithProjectAndCrewRow {
  const app = mapApplication(raw)
  const projRaw = raw.project as Record<string, unknown> | null | undefined
  const crewRaw = raw.crew as Record<string, unknown> | null | undefined
  return {
    ...app,
    project: projRaw ? toProjectWithEmployer(projRaw) : undefined,
    crew: crewRaw ? toCrewWithUser(crewRaw) : undefined,
  }
}

export interface ApplicationFilters {
  projectId?: string
  crewId?: string
  status?: ApplicationStatus
  take?: number
  skip?: number
}

export async function findManyWithCrew(filters: ApplicationFilters = {}): Promise<ApplicationWithCrewRow[]> {
  let q = getServiceClient().from('applications').select(APP_WITH_CREW).order('applied_at', { ascending: false })
  if (filters.projectId) q = q.eq('project_id', filters.projectId)
  if (filters.crewId) q = q.eq('crew_id', filters.crewId)
  if (filters.status) q = q.eq('status', filters.status)
  if (filters.take) {
    const skip = filters.skip ?? 0
    q = q.range(skip, skip + filters.take - 1)
  }
  const { data, error } = await q
  throwOnError('application.findManyWithCrew', error)
  return (data ?? []).map((r) => toAppWithCrew(r as Record<string, unknown>))
}

export async function findManyWithProjectAndCrew(filters: ApplicationFilters = {}): Promise<ApplicationWithProjectAndCrewRow[]> {
  let q = getServiceClient().from('applications').select(APP_WITH_PROJECT_CREW).order('applied_at', { ascending: false })
  if (filters.projectId) q = q.eq('project_id', filters.projectId)
  if (filters.crewId) q = q.eq('crew_id', filters.crewId)
  if (filters.status) q = q.eq('status', filters.status)
  if (filters.take) {
    const skip = filters.skip ?? 0
    q = q.range(skip, skip + filters.take - 1)
  }
  const { data, error } = await q
  throwOnError('application.findManyWithProjectAndCrew', error)
  return (data ?? []).map((r) => toAppWithProjectAndCrew(r as Record<string, unknown>))
}

export async function findUniqueByProjectAndCrew(projectId: string, crewId: string): Promise<ApplicationRow | null> {
  const { data, error } = await getServiceClient()
    .from('applications')
    .select(APP_COLS)
    .eq('project_id', projectId)
    .eq('crew_id', crewId)
    .maybeSingle()
  throwOnError('application.findUniqueByProjectAndCrew', error)
  return data ? mapApplication(data as Record<string, unknown>) : null
}

export interface CreateApplicationInput {
  projectId: string
  crewId: string
  answers: Record<string, unknown> | string[]
  crewNotes?: string | null
}

export async function create(input: CreateApplicationInput, _req: Requester): Promise<ApplicationRow> {
  const { data, error } = await getServiceClient()
    .from('applications')
    .insert({
      project_id: input.projectId,
      crew_id: input.crewId,
      status: 'PENDING',
      answers: input.answers,
      crew_notes: input.crewNotes ?? null,
      applied_at: now().toISOString(),
    })
    .select(APP_COLS)
    .single()
  throwOnError('application.create', error)
  return mapApplication(data as Record<string, unknown>)
}

export interface UpdateApplicationInput {
  status?: ApplicationStatus
  employerNotes?: string | null
  crewNotes?: string | null
}

export async function update(id: string, input: UpdateApplicationInput, _req: Requester): Promise<ApplicationRow | null> {
  const patch: Record<string, unknown> = {}
  if (input.status !== undefined) patch.status = input.status
  if (input.employerNotes !== undefined) patch.employer_notes = input.employerNotes
  if (input.crewNotes !== undefined) patch.crew_notes = input.crewNotes
  const { data, error } = await getServiceClient().from('applications').update(patch).eq('id', id).select(APP_COLS).maybeSingle()
  throwOnError('application.update', error)
  return data ? mapApplication(data as Record<string, unknown>) : null
}

export async function findById(id: string): Promise<ApplicationWithProjectAndCrewRow | null> {
  const { data, error } = await getServiceClient().from('applications').select(APP_WITH_PROJECT_CREW).eq('id', id).maybeSingle()
  throwOnError('application.findById', error)
  return data ? toAppWithProjectAndCrew(data as Record<string, unknown>) : null
}

export async function countAll(_req: Requester): Promise<number> {
  const { count, error } = await getServiceClient().from('applications').select('id', { count: 'exact', head: true })
  throwOnError('application.count', error)
  return count ?? 0
}

export async function countByStatus(status: ApplicationStatus, _req: Requester): Promise<number> {
  const { count, error } = await getServiceClient()
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('status', status)
  throwOnError('application.countByStatus', error)
  return count ?? 0
}

export async function countByProjectId(projectId: string): Promise<number> {
  const { count, error } = await getServiceClient().from('applications').select('id', { count: 'exact', head: true }).eq('project_id', projectId)
  throwOnError('application.countByProjectId', error)
  return count ?? 0
}

// Monthly application-limit check (api/projects/[id]/apply).
export async function countByCrewIdSince(crewId: string, since: Date): Promise<number> {
  const { count, error } = await getServiceClient()
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('crew_id', crewId)
    .gte('applied_at', since.toISOString())
  throwOnError('application.countByCrewIdSince', error)
  return count ?? 0
}

export type { ApplicationRow, ApplicationWithCrewRow, ApplicationWithProjectAndCrewRow, ApplicationStatus }