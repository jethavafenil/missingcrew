import { getServiceClient } from '@/lib/repo/client'
import { now, throwOnError, firstOrNull } from '@/lib/repo/helpers'
import {
  mapConnection,
  mapUser,
  mapCrewProfile,
  mapEmployerProfile,
  type ConnectionRow,
  type RequesterUserRow,
  type ConnectionStatus,
} from '@/lib/repo/types'
import type { Requester } from '@/lib/repo/types'

const CREW_PREVIEW =
  'crew_profiles(id,photo,city,primary_roles,years_experience,location,contact_whatsapp,portfolio_links,imdb_link)'
const EMPLOYER_PREVIEW = 'employer_profiles(id,company_name,company_website)'

// connections has two FKs to users (requester_id, receiver_id), so the embed
// needs an FK hint or PostgREST rejects it as ambiguous. requester/receiver
// therefore each get their own select string with the matching constraint.
const REQUESTER_SELECT = `requester:users!connections_requester_id_fkey(id,name,email,phone,${CREW_PREVIEW},${EMPLOYER_PREVIEW})`
const RECEIVER_SELECT = `receiver:users!connections_receiver_id_fkey(id,name,email,phone,${CREW_PREVIEW},${EMPLOYER_PREVIEW})`
const CONNECTION_BASE = 'id,requester_id,receiver_id,status,created_at,updated_at'

// users->crew_profiles/employer_profiles are array-shaped embeds (see
// firstOrNull in helpers); PostgREST cannot assume to-one there.

function toRequesterUser(raw: Record<string, unknown> | null | undefined): RequesterUserRow | undefined {
  if (!raw) return undefined
  const u = mapUser(raw)
  const crewRaw = firstOrNull(raw.crew_profiles)
  const employerRaw = firstOrNull(raw.employer_profiles)
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    crewProfile: crewRaw
      ? mapCrewProfile(crewRaw)
      : null,
    employerProfile: employerRaw
      ? mapEmployerProfile(employerRaw)
      : null,
  }
}

function toConnection(raw: Record<string, unknown>): ConnectionRow {
  const c = mapConnection(raw)
  const requesterRaw = raw.requester as Record<string, unknown> | null | undefined
  const receiverRaw = raw.receiver as Record<string, unknown> | null | undefined
  return {
    ...c,
    requester: toRequesterUser(requesterRaw),
    receiver: toRequesterUser(receiverRaw),
  }
}

export async function findManyByUserId(
  userId: string,
  _req: Requester,
  opts?: { status?: ConnectionStatus }
): Promise<ConnectionRow[]> {
  let query = getServiceClient()
    .from('connections')
    .select(`${CONNECTION_BASE},${REQUESTER_SELECT},${RECEIVER_SELECT}`)
    .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
  if (opts?.status) query = query.eq('status', opts.status)
  const { data, error } = await query.order('updated_at', { ascending: false })
  throwOnError('connection.findManyByUserId', error)
  return (data ?? []).map((r) => toConnection(r as Record<string, unknown>))
}

export async function findIncomingByUserId(
  userId: string,
  _req: Requester,
  opts?: { status?: ConnectionStatus }
): Promise<ConnectionRow[]> {
  let query = getServiceClient()
    .from('connections')
    .select(`${CONNECTION_BASE},${REQUESTER_SELECT}`)
    .eq('receiver_id', userId)
  if (opts?.status) query = query.eq('status', opts.status)
  const { data, error } = await query.order('created_at', { ascending: false })
  throwOnError('connection.findIncomingByUserId', error)
  return (data ?? []).map((r) => toConnection(r as Record<string, unknown>))
}

export async function findSentByUserId(
  userId: string,
  _req: Requester,
  opts?: { status?: ConnectionStatus }
): Promise<ConnectionRow[]> {
  let query = getServiceClient()
    .from('connections')
    .select(`${CONNECTION_BASE},${RECEIVER_SELECT}`)
    .eq('requester_id', userId)
  if (opts?.status) query = query.eq('status', opts.status)
  const { data, error } = await query.order('created_at', { ascending: false })
  throwOnError('connection.findSentByUserId', error)
  return (data ?? []).map((r) => toConnection(r as Record<string, unknown>))
}

export interface CreateConnectionInput {
  requesterId: string
  receiverId: string
}

export async function findById(id: string): Promise<ConnectionRow | null> {
  const { data, error } = await getServiceClient()
    .from('connections')
    .select(`${CONNECTION_BASE},${REQUESTER_SELECT},${RECEIVER_SELECT}`)
    .eq('id', id)
    .maybeSingle()
  throwOnError('connection.findById', error)
  return data ? toConnection(data as Record<string, unknown>) : null
}

export async function create(input: CreateConnectionInput, _req: Requester): Promise<ConnectionRow> {
  const { data, error } = await getServiceClient()
    .from('connections')
    .insert({
      requester_id: input.requesterId,
      receiver_id: input.receiverId,
      status: 'PENDING',
      created_at: now().toISOString(),
      updated_at: now().toISOString(),
    })
    .select('id,requester_id,receiver_id,status,created_at,updated_at')
    .single()
  throwOnError('connection.create', error)
  return mapConnection(data as Record<string, unknown>)
}

export async function findExistingBetween(userA: string, userB: string): Promise<ConnectionRow | null> {
  const { data, error } = await getServiceClient()
    .from('connections')
    .select('id,requester_id,receiver_id,status,created_at,updated_at')
    .or(`and(requester_id.eq.${userA},receiver_id.eq.${userB}),and(requester_id.eq.${userB},receiver_id.eq.${userA})`)
    .maybeSingle()
  throwOnError('connection.findExistingBetween', error)
  return data ? mapConnection(data as Record<string, unknown>) : null
}

export interface UpdateConnectionInput {
  status?: ConnectionStatus
  requesterId?: string
  receiverId?: string
}

export async function update(id: string, input: UpdateConnectionInput, _req: Requester): Promise<ConnectionRow | null> {
  const patch: Record<string, unknown> = { updated_at: now().toISOString() }
  if (input.status !== undefined) patch.status = input.status
  if (input.requesterId !== undefined) patch.requester_id = input.requesterId
  if (input.receiverId !== undefined) patch.receiver_id = input.receiverId
  const { data, error } = await getServiceClient()
    .from('connections')
    .update(patch)
    .eq('id', id)
    .select('id,requester_id,receiver_id,status,created_at,updated_at')
    .maybeSingle()
  throwOnError('connection.update', error)
  return data ? mapConnection(data as Record<string, unknown>) : null
}

export type { ConnectionRow, ConnectionStatus }