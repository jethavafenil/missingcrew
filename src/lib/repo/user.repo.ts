import { getServiceClient } from '@/lib/repo/client'
import { now, throwOnError, iso, firstOrNull } from '@/lib/repo/helpers'
import type { UserRole } from '@/lib/repo/types'
import {
  mapUser,
  mapCrewProfile,
  mapEmployerProfile,
  mapSubscription,
  mapSubscriptionPlan,
  asDate,
} from '@/lib/repo/types'
import type { Requester } from '@/lib/repo/types'

const USER_COLS =
  'id,auth_id,name,email,email_verified,image,phone,"phoneVerified",role,created_at,updated_at,password'

export interface CreateUserInput {
  email: string
  name?: string | null
  image?: string | null
  emailVerified?: Date | string | null
  password?: string | null
  role?: UserRole
  phone?: string | null
  phoneVerified?: boolean
}

export interface UpdateUserInput {
  name?: string | null
  image?: string | null
  email?: string
  phone?: string | null
  phoneVerified?: boolean
  role?: UserRole
  emailVerified?: Date | string | null
  password?: string | null
}

// Find a user by email (with profiles). Used by the register routes to locate
// the trigger-provisioned row after admin.createUser.
export async function findByEmail(email: string, _req: Pick<Requester, 'userId'>): Promise<UserWithProfiles | null> {
  const { data, error } = await getServiceClient()
    .from('users')
    .select(`${USER_COLS},crew_profiles(*),employer_profiles(*)`)
    .eq('email', email)
    .maybeSingle()
  throwOnError('users.findByEmail', error)
  return attachProfiles(data)
}

// Resolve the app user (public.users) for a Supabase Auth uuid. Used by the
// session helpers (src/lib/auth/server.ts) to bridge auth.users -> users.id.
export async function findByAuthId(authId: string): Promise<UserWithProfiles | null> {
  const { data, error } = await getServiceClient()
    .from('users')
    .select(`${USER_COLS},crew_profiles(*),employer_profiles(*)`)
    .eq('auth_id', authId)
    .maybeSingle()
  throwOnError('users.findByAuthId', error)
  return attachProfiles(data)
}

export async function findById(id: string, _req: Pick<Requester, 'userId'>): Promise<UserWithProfiles | null> {
  const { data, error } = await getServiceClient()
    .from('users')
    .select(`${USER_COLS},crew_profiles(*),employer_profiles(*)`)
    .eq('id', id)
    .maybeSingle()
  throwOnError('users.findById', error)
  return attachProfiles(data)
}

export async function findByIdWithSubscriptions(id: string, _req: Requester): Promise<UserWithAdminRelations | null> {
  const { data, error } = await getServiceClient()
    .from('users')
    .select(`${USER_COLS},crew_profiles(*),employer_profiles(*),subscriptions(*,plan:subscription_plans(id,name,price,description,features,stripe_price_id,created_at,updated_at))`)
    .eq('id', id)
    .maybeSingle()
  throwOnError('users.findByIdWithSubscriptions', error)
  return attachAdminRelations(data)
}

// Referral: find a CREW user by email (case-insensitive) with their crew profile.
export async function findByEmailIgnoreCaseWithCrew(email: string, _req: Requester): Promise<UserWithProfiles | null> {
  const { data, error } = await getServiceClient()
    .from('users')
    .select(`${USER_COLS},crew_profiles(*)`)
    .eq('role', 'CREW')
    .ilike('email', email)
    .maybeSingle()
  throwOnError('users.findByEmailIgnoreCaseWithCrew', error)
  return attachProfiles(data)
}

export interface UserWithProfiles {
  id: string
  authId: string | null
  name: string | null
  email: string
  emailVerified: Date | null
  image: string | null
  phone: string | null
  phoneVerified: boolean
  role: UserRole
  createdAt: Date
  updatedAt: Date
  password: string | null
  crewProfile?: object | null
  employerProfile?: object | null
}

export interface UserWithAdminRelations extends UserWithProfiles {
  crewProfile?: object | null
  employerProfile?: object | null
  subscriptions?: Array<object>
}

function attachProfiles(raw: Record<string, unknown> | null): UserWithProfiles | null {
  if (!raw) return null
  const user = mapUser(raw)
  // users -> crew_profiles/employer_profiles are array-shaped embeds (see
  // firstOrNull); casting them directly to objects silently nulls every field.
  const crew = firstOrNull(raw.crew_profiles)
  const employer = firstOrNull(raw.employer_profiles)
  return {
    ...user,
    crewProfile: crew ? mapCrewProfile(crew) : null,
    employerProfile: employer ? mapEmployerProfile(employer) : null,
  }
}

function attachAdminRelations(raw: Record<string, unknown> | null): UserWithAdminRelations | null {
  if (!raw) return null
  const base = attachProfiles(raw)
  if (!base) return null
  const subsRaw = raw.subscriptions as Array<Record<string, unknown>> | null | undefined
  return {
    ...base,
    subscriptions: (subsRaw ?? []).map((s) => ({
      ...mapSubscription(s),
      plan: s.plan ? mapSubscriptionPlan(s.plan as Record<string, unknown>) : undefined,
    })),
  }
}

export async function createUser(input: CreateUserInput, _req: Requester): Promise<UserWithProfiles> {
  const { data, error } = await getServiceClient()
    .from('users')
    .insert({
      email: input.email,
      name: input.name ?? null,
      image: input.image ?? null,
      email_verified: iso(input.emailVerified),
      password: input.password ?? null,
      role: input.role ?? 'CREW',
      phone: input.phone ?? null,
      phoneVerified: input.phoneVerified ?? false,
      created_at: now().toISOString(),
      updated_at: now().toISOString(),
    })
    .select()
    .single()
  throwOnError('users.create', error)
  return attachProfiles(data as Record<string, unknown>)!
}

export async function updateUser(id: string, input: UpdateUserInput, _req: Requester): Promise<UserWithProfiles> {  const patch: Record<string, unknown> = { updated_at: now().toISOString() }
  if (input.name !== undefined) patch.name = input.name
  if (input.image !== undefined) patch.image = input.image
  if (input.email !== undefined) patch.email = input.email
  if (input.phone !== undefined) patch.phone = input.phone
  if (input.phoneVerified !== undefined) patch.phoneVerified = input.phoneVerified
  if (input.role !== undefined) patch.role = input.role
  if (input.emailVerified !== undefined) patch.email_verified = iso(input.emailVerified)
  if (input.password !== undefined) patch.password = input.password

  const { data, error } = await getServiceClient()
    .from('users')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  throwOnError('users.update', error)
  return attachProfiles(data as Record<string, unknown>)!
}

// Admin: delete the app user row (FK cascades to profiles, etc.). The
// auth.users row is removed separately by the admin route via the auth admin API.
export async function deleteUser(userId: string, _req: Requester & { role: 'ADMIN' }): Promise<void> {
  const { error } = await getServiceClient().from('users').delete().eq('id', userId)
  throwOnError('users.delete', error)
}

export interface AdminUserFilter {
  search?: string
  role?: UserRole
  skip?: number
  take?: number
}

export async function countAll(_req: Requester): Promise<number> {
  const { count, error } = await getServiceClient().from('users').select('id', { count: 'exact', head: true })
  throwOnError('users.count', error)
  return count ?? 0
}

export async function countByRole(role: UserRole, _req: Requester): Promise<number> {
  const { count, error } = await getServiceClient()
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('role', role)
  throwOnError('users.countByRole', error)
  return count ?? 0
}

export async function countCreatedSince(since: Date, _req: Requester): Promise<number> {
  const { count, error } = await getServiceClient()
    .from('users')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', since.toISOString())
  throwOnError('users.countCreatedSince', error)
  return count ?? 0
}

function adminUserQuery(filter: AdminUserFilter) {
  let q = getServiceClient()
    .from('users')
    .select(`${USER_COLS},crew_profiles(*),employer_profiles(*),subscriptions(*,plan:subscription_plans(id,name,price,description,features,stripe_price_id,created_at,updated_at))`, { count: 'exact' })
  if (filter.role) q = q.eq('role', filter.role)
  if (filter.search) {
    q = q.or(`name.ilike.%${filter.search}%,email.ilike.%${filter.search}%`)
  }
  return q
}

export async function findAdminUsers(filter: AdminUserFilter, _req: Requester & { role: 'ADMIN' }): Promise<{
  users: UserWithAdminRelations[]
  total: number
}> {
  let q = adminUserQuery(filter).order('created_at', { ascending: false })
  if (filter.skip) q = q.range(filter.skip, filter.skip + (filter.take ?? 25) - 1)
  else if (filter.take) q = q.range(0, filter.take - 1)
  const { data, error, count } = await q
  throwOnError('users.findAdmin', error)
  const rows = (data ?? []) as Array<Record<string, unknown>>
  return {
    users: rows.map((r) => attachAdminRelations(r)!).filter(Boolean),
    total: count ?? rows.length,
  }
}

export async function countAdminUsers(filter: AdminUserFilter, _req: Requester & { role: 'ADMIN' }): Promise<number> {
  let q = getServiceClient()
    .from('users')
    .select('id', { count: 'exact', head: true })
  if (filter.role) q = q.eq('role', filter.role)
  if (filter.search) q = q.or(`name.ilike.%${filter.search}%,email.ilike.%${filter.search}%`)
  const { error, count } = await q
  throwOnError('users.countAdmin', error)
  return count ?? 0
}

export async function findByIdRaw(id: string): Promise<{
  id: string
  name: string | null
  email: string
  emailVerified: Date | null
  phone: string | null
  phoneVerified: boolean
  role: UserRole
  createdAt: Date
} | null> {
  const { data, error } = await getServiceClient().from('users').select(USER_COLS).eq('id', id).maybeSingle()
  throwOnError('users.findByIdRaw', error)
  if (!data) return null
  const u = mapUser(data as Record<string, unknown>)
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    emailVerified: u.emailVerified,
    phone: u.phone,
    phoneVerified: u.phoneVerified,
    role: u.role,
    createdAt: u.createdAt,
  }
}

export type { UserRow } from '@/lib/repo/types'
export { asDate }