import { getServiceClient } from '@/lib/repo/client'
import { now, throwOnError } from '@/lib/repo/helpers'
import {
  asDate,
  asStringList,
  mapHireRequest,
  type HireRequestRow,
  type HireRequestStatus,
  type HireRequestWithRelations,
} from '@/lib/repo/types'

export const HIRE_COLS = 'id,employer_id,crew_id,project_id,role,message,status,created_at,responded_at'

const WITH_RELATIONS =
  `${HIRE_COLS},` +
  'project:projects(id,project_name,project_type,location,shoot_start_date,shoot_end_date,production_house),' +
  'employer:employer_profiles(id,"userId",company_name,user:users(id,name,email)),' +
  'crew:crew_profiles(id,"userId",photo,primary_roles,user:users(id,name,email))'

type Raw = Record<string, unknown>

function toWithRelations(raw: Raw): HireRequestWithRelations {
  const base = mapHireRequest(raw)
  const p = raw.project as Raw | null | undefined
  const e = raw.employer as Raw | null | undefined
  const c = raw.crew as Raw | null | undefined
  const user = (u: unknown) => {
    const x = u as Raw | null | undefined
    return x ? { id: x.id as string, name: (x.name as string | null) ?? null, email: x.email as string } : undefined
  }
  return {
    ...base,
    project: p
      ? {
          id: p.id as string,
          projectName: p.project_name as string,
          projectType: p.project_type as string,
          location: p.location as string,
          shootStartDate: asDate(p.shoot_start_date),
          shootEndDate: asDate(p.shoot_end_date),
          productionHouse: (p.production_house as string | null) ?? null,
        }
      : undefined,
    employer: e
      ? { id: e.id as string, userId: e.userId as string, companyName: e.company_name as string, user: user(e.user) }
      : undefined,
    crew: c
      ? {
          id: c.id as string,
          userId: c.userId as string,
          photo: (c.photo as string | null) ?? null,
          primaryRoles: asStringList(c.primary_roles),
          user: user(c.user),
        }
      : undefined,
  }
}

export interface CreateHireRequestInput {
  employerId: string
  crewId: string
  projectId: string
  role?: string | null
  message: string
}

export async function create(input: CreateHireRequestInput): Promise<HireRequestRow> {
  const { data, error } = await getServiceClient()
    .from('hire_requests')
    .insert({
      employer_id: input.employerId,
      crew_id: input.crewId,
      project_id: input.projectId,
      role: input.role ?? null,
      message: input.message,
      status: 'PENDING',
      created_at: now().toISOString(),
    })
    .select(HIRE_COLS)
    .single()
  throwOnError('hireRequest.create', error)
  return mapHireRequest(data as unknown as Raw)
}

export async function findById(id: string): Promise<HireRequestWithRelations | null> {
  const { data, error } = await getServiceClient().from('hire_requests').select(WITH_RELATIONS).eq('id', id).maybeSingle()
  throwOnError('hireRequest.findById', error)
  return data ? toWithRelations(data as unknown as Raw) : null
}

export async function findByProjectAndCrew(projectId: string, crewId: string): Promise<HireRequestRow | null> {
  const { data, error } = await getServiceClient()
    .from('hire_requests')
    .select(HIRE_COLS)
    .eq('project_id', projectId)
    .eq('crew_id', crewId)
    .maybeSingle()
  throwOnError('hireRequest.findByProjectAndCrew', error)
  return data ? mapHireRequest(data as unknown as Raw) : null
}

export async function listForCrew(crewId: string): Promise<HireRequestWithRelations[]> {
  const { data, error } = await getServiceClient()
    .from('hire_requests')
    .select(WITH_RELATIONS)
    .eq('crew_id', crewId)
    .order('created_at', { ascending: false })
  throwOnError('hireRequest.listForCrew', error)
  return (data ?? []).map((r) => toWithRelations(r as unknown as Raw))
}

export async function listForEmployer(employerId: string, opts?: { crewId?: string }): Promise<HireRequestWithRelations[]> {
  let q = getServiceClient().from('hire_requests').select(WITH_RELATIONS).eq('employer_id', employerId)
  if (opts?.crewId) q = q.eq('crew_id', opts.crewId)
  const { data, error } = await q.order('created_at', { ascending: false })
  throwOnError('hireRequest.listForEmployer', error)
  return (data ?? []).map((r) => toWithRelations(r as unknown as Raw))
}

// Only moves a request out of PENDING (guards against double responses / races).
export async function respond(id: string, status: Exclude<HireRequestStatus, 'PENDING'>): Promise<HireRequestRow | null> {
  const { data, error } = await getServiceClient()
    .from('hire_requests')
    .update({ status, responded_at: now().toISOString() })
    .eq('id', id)
    .eq('status', 'PENDING')
    .select(HIRE_COLS)
    .maybeSingle()
  throwOnError('hireRequest.respond', error)
  return data ? mapHireRequest(data as unknown as Raw) : null
}

// A producer may re-send a request they previously cancelled (declines stay final).
export async function reopenCancelled(id: string, input: { role?: string | null; message: string }): Promise<HireRequestRow | null> {
  const { data, error } = await getServiceClient()
    .from('hire_requests')
    .update({ status: 'PENDING', role: input.role ?? null, message: input.message, responded_at: null, created_at: now().toISOString() })
    .eq('id', id)
    .eq('status', 'CANCELLED')
    .select(HIRE_COLS)
    .maybeSingle()
  throwOnError('hireRequest.reopenCancelled', error)
  return data ? mapHireRequest(data as unknown as Raw) : null
}
