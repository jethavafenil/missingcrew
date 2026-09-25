import { getServiceClient } from '@/lib/repo/client'
import { now, throwOnError, iso } from '@/lib/repo/helpers'
import {
  mapEmployerProfile,
  mapUser,
  mapProject,
  mapApplication,
  mapCrewProfile,
  type EmployerProfileRow,
  type EmployerProfileWithUserRow,
  type ProjectWithEmployerRow,
  type ApplicationWithProjectAndCrewRow,
  type CrewProfileWithUserRow,
} from '@/lib/repo/types'
import type { Requester } from '@/lib/repo/types'

export const EMPLOYER_COLS =
  'id,"userId",company_name,company_website,completed,created_at,updated_at'

const EMPLOYER_WITH_USER = `${EMPLOYER_COLS},user:users(id,name,email,image,phone,"phoneVerified")`

function toEmployerWithUser(raw: Record<string, unknown>): EmployerProfileWithUserRow {
  const ep = mapEmployerProfile(raw)
  return {
    ...ep,
    user: raw.user ? mapUser(raw.user as Record<string, unknown>) : undefined,
  }
}

export async function findByUserIdWithProjectsAndApplications(
  userId: string,
  _req?: Requester,
): Promise<EmployerProfileWithUserRow | null> {
  const { data, error } = await getServiceClient()
    .from('employer_profiles')
    .select(
      `${EMPLOYER_WITH_USER},projects(*,applications(*,crew:crew_profiles(${CREW_COLS_CONST},user:users(id,name,email,phone,"phoneVerified"))))`,
    )
    .eq('userId', userId)
    .maybeSingle()
  throwOnError('employerProfile.findByUserIdWithProjectsAndApplications', error)
  if (!data) return null
  const ep = toEmployerWithUser(data as Record<string, unknown>)
  const projectsRaw = (data as Record<string, unknown>).projects as Array<Record<string, unknown>> | null | undefined
  ep.projects = (projectsRaw ?? []).map((p) => mapProjectWithRelations(p))
  return ep
}

export async function findByUserId(userId: string, _req: Requester): Promise<EmployerProfileRow | null> {
  const { data, error } = await getServiceClient().from('employer_profiles').select(EMPLOYER_COLS).eq('userId', userId).maybeSingle()
  throwOnError('employerProfile.findByUserId', error)
  return data ? mapEmployerProfile(data as Record<string, unknown>) : null
}

export async function findById(id: string): Promise<EmployerProfileRow | null> {
  const { data, error } = await getServiceClient().from('employer_profiles').select(EMPLOYER_COLS).eq('id', id).maybeSingle()
  throwOnError('employerProfile.findById', error)
  return data ? mapEmployerProfile(data as Record<string, unknown>) : null
}

// All employer profiles (admin/import assigns projects to a random employer;
// the old query's `include: { user: true }` was never read)
export async function findMany(_req: Requester & { role: 'ADMIN' }): Promise<EmployerProfileRow[]> {
  const { data, error } = await getServiceClient().from('employer_profiles').select(EMPLOYER_COLS)
  throwOnError('employerProfile.findMany', error)
  return (data ?? []).map((r) => mapEmployerProfile(r as Record<string, unknown>))
}

export interface EmployerProfileInput {
  companyName?: string | null
  companyWebsite?: string | null
  completed?: boolean
}

export interface CreateEmployerProfileInput extends EmployerProfileInput {
  userId: string
}

export async function create(input: CreateEmployerProfileInput, _req: Requester): Promise<EmployerProfileRow> {
  const { data, error } = await getServiceClient()
    .from('employer_profiles')
    .insert({
      userId: input.userId,
      company_name: input.companyName ?? null,
      company_website: input.companyWebsite ?? null,
      completed: input.completed ?? false,
      created_at: now().toISOString(),
      updated_at: now().toISOString(),
    })
    .select(EMPLOYER_COLS)
    .single()
  throwOnError('employerProfile.create', error)
  return mapEmployerProfile(data as Record<string, unknown>)
}

// Prisma `upsert`: create if absent, else update.
export async function upsertByUserId(userId: string, input: EmployerProfileInput, _req: Requester): Promise<EmployerProfileRow> {
  const existing = await findByUserId(userId, _req)
  if (!existing) {
    return create({ userId, ...input }, _req)
  }
  const updated = await updateByUserId(userId, input, _req)
  if (!updated) throw new Error('employerProfile.upsert: update returned no row')
  return updated
}

export async function updateByUserId(
  userId: string,
  input: EmployerProfileInput,
  _req: Requester,
): Promise<EmployerProfileRow | null> {
  const patch: Record<string, unknown> = { updated_at: now().toISOString() }
  if (input.companyName !== undefined) patch.company_name = input.companyName
  if (input.companyWebsite !== undefined) patch.company_website = input.companyWebsite
  if (input.completed !== undefined) patch.completed = input.completed
  const { data, error } = await getServiceClient()
    .from('employer_profiles')
    .update(patch)
    .eq('userId', userId)
    .select(EMPLOYER_COLS)
    .maybeSingle()
  throwOnError('employerProfile.updateByUserId', error)
  return data ? mapEmployerProfile(data as Record<string, unknown>) : null
}

// System-only (auth plumbing): drop the placeholder profile when an OAuth
// signup's role is corrected (see src/app/auth/callback/route.ts).
export async function deleteByUserId(userId: string, _req: Requester): Promise<void> {
  const { error } = await getServiceClient().from('employer_profiles').delete().eq('userId', userId)
  throwOnError('employerProfile.deleteByUserId', error)
}

export async function findByIdWithUser(id: string): Promise<EmployerProfileWithUserRow | null> {
  const { data, error } = await getServiceClient().from('employer_profiles').select(EMPLOYER_WITH_USER).eq('id', id).maybeSingle()
  throwOnError('employerProfile.findByIdWithUser', error)
  return data ? toEmployerWithUser(data as Record<string, unknown>) : null
}

export const CREW_COLS_CONST =
  'id,"userId",photo,city,budget_range_min,budget_range_max,"budgetFlexible",primary_roles,years_experience,location,available_to_travel,availability,availability_start,availability_end,project_types,daily_budget_min,daily_budget_max,languages,imdb_link,portfolio_links,past_projects,referred_by,contact_whatsapp,terms_agreed,subscription_tier,trial_ends,completed,created_at,updated_at'

// Full dashboard shape: profile + projects incl applications w/ crew + user.
export async function findByIdWithProjectsAndApplications(
  id: string,
): Promise<EmployerProfileWithUserRow | null> {
  const { data, error } = await getServiceClient()
    .from('employer_profiles')
    .select(
      `${EMPLOYER_WITH_USER},projects(*,applications(*,crew:crew_profiles(${CREW_COLS_CONST},user:users(id,name,email,phone,"phoneVerified"))))`,
    )
    .eq('id', id)
    .maybeSingle()
  throwOnError('employerProfile.findByIdWithProjectsAndApplications', error)
  if (!data) return null
  const ep = toEmployerWithUser(data as Record<string, unknown>)
  const projectsRaw = (data as Record<string, unknown>).projects as Array<Record<string, unknown>> | null | undefined
  ep.projects = (projectsRaw ?? []).map((p) => mapProjectWithRelations(p))
  return ep
}

function mapProjectWithRelations(raw: Record<string, unknown>): ProjectWithEmployerRow {
  const p = mapProject(raw as Record<string, unknown>)
  const employerRaw = raw.employer as Record<string, unknown> | null | undefined
  const appsRaw = raw.applications as Array<Record<string, unknown>> | null | undefined
  const out: ProjectWithEmployerRow = {
    ...p,
    employer: employerRaw ? toEmployerWithUser(employerRaw) : undefined,
  }
  if (appsRaw) {
    out.applications = appsRaw.map((a) => {
      const app = mapApplication(a)
      const crewRaw = a.crew as Record<string, unknown> | null | undefined
      return {
        ...app,
        crew: crewRaw ? toCrewWithUser(crewRaw) : undefined,
      }
    })
  }
  return out
}

function toCrewWithUser(raw: Record<string, unknown>): CrewProfileWithUserRow {
  const crew = mapCrewProfile(raw)
  return { ...crew, user: raw.user ? mapUser(raw.user as Record<string, unknown>) : undefined }
}

export type { EmployerProfileRow, EmployerProfileWithUserRow, ApplicationWithProjectAndCrewRow }