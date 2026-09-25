import { getServiceClient } from '@/lib/repo/client'
import { now, throwOnError, iso } from '@/lib/repo/helpers'
import { mapCrewProfile, mapUser, type CrewProfileRow, type CrewProfileWithUserRow } from '@/lib/repo/types'
import type { Requester, SubscriptionTier, UserRole } from '@/lib/repo/types'

export const CREW_COLS =
  'id,"userId",photo,city,budget_range_min,budget_range_max,"budgetFlexible",primary_roles,years_experience,location,available_to_travel,availability,availability_start,availability_end,project_types,daily_budget_min,daily_budget_max,languages,imdb_link,portfolio_links,past_projects,referred_by,contact_whatsapp,terms_agreed,subscription_tier,trial_ends,completed,created_at,updated_at'

const CREW_WITH_USER = `${CREW_COLS},user:users(id,name,email,phone,"phoneVerified")`

function toCrewWithUser(raw: Record<string, unknown>): CrewProfileWithUserRow {
  const crew = mapCrewProfile(raw)
  return {
    ...crew,
    user: raw.user ? mapUser(raw.user as Record<string, unknown>) : undefined,
  }
}

// user.role/user.name filters on this query REQUIRE !inner: PostgREST
// embedded filters without !inner do not filter parent rows — they null the
// embed instead, returning every profile with user: undefined.
const CREW_WITH_USER_INNER = `${CREW_COLS},user:users!inner(id,name,email,phone,"phoneVerified")`

function crewQuery() {
  return getServiceClient().from('crew_profiles').select(CREW_WITH_USER)
}

function crewQueryInner() {
  return getServiceClient().from('crew_profiles').select(CREW_WITH_USER_INNER)
}

export async function findByUserId(userId: string, _req: Requester): Promise<CrewProfileRow | null> {
  const { data, error } = await getServiceClient().from('crew_profiles').select(CREW_COLS).eq('userId', userId).maybeSingle()
  throwOnError('crewProfile.findByUserId', error)
  return data ? mapCrewProfile(data as Record<string, unknown>) : null
}

export async function findByUserIdWithUser(userId: string, _req?: Requester): Promise<CrewProfileWithUserRow | null> {
  const { data, error } = await crewQuery().eq('userId', userId).maybeSingle()
  throwOnError('crewProfile.findByUserIdWithUser', error)
  return data ? toCrewWithUser(data as Record<string, unknown>) : null
}

export async function findByIdWithUser(id: string): Promise<CrewProfileWithUserRow | null> {
  const { data, error } = await crewQuery().eq('id', id).maybeSingle()
  throwOnError('crewProfile.findByIdWithUser', error)
  return data ? toCrewWithUser(data as Record<string, unknown>) : null
}

export interface UpdateCrewProfileInput {
  photo?: string | null
  city?: string | null
  budgetRangeMin?: number | null
  budgetRangeMax?: number | null
  budgetFlexible?: boolean
  primaryRoles?: string[]
  yearsExperience?: string | null
  location?: string | null
  availableToTravel?: boolean
  availability?: boolean
  availabilityStart?: Date | string | null
  availabilityEnd?: Date | string | null
  projectTypes?: string[]
  dailyBudgetMin?: number | null
  dailyBudgetMax?: number | null
  languages?: string[] | Record<string, unknown>
  imdbLink?: string | null
  portfolioLinks?: string[]
  pastProjects?: unknown | null
  referredBy?: string | null
  contactWhatsApp?: string | null
  termsAgreed?: boolean
  completed?: boolean
  subscriptionTier?: SubscriptionTier
  trialEnds?: Date | string | null
}

function buildCrewPatch(input: UpdateCrewProfileInput): Record<string, unknown> {
  const patch: Record<string, unknown> = { updated_at: now().toISOString() }
  if (input.photo !== undefined) patch.photo = input.photo
  if (input.city !== undefined) patch.city = input.city
  if (input.budgetRangeMin !== undefined) patch.budget_range_min = input.budgetRangeMin
  if (input.budgetRangeMax !== undefined) patch.budget_range_max = input.budgetRangeMax
  if (input.budgetFlexible !== undefined) patch.budgetFlexible = input.budgetFlexible
  if (input.primaryRoles !== undefined) patch.primary_roles = input.primaryRoles
  if (input.yearsExperience !== undefined) patch.years_experience = input.yearsExperience
  if (input.location !== undefined) patch.location = input.location
  if (input.availableToTravel !== undefined) patch.available_to_travel = input.availableToTravel
  if (input.availability !== undefined) patch.availability = input.availability
  if (input.availabilityStart !== undefined) patch.availability_start = iso(input.availabilityStart)
  if (input.availabilityEnd !== undefined) patch.availability_end = iso(input.availabilityEnd)
  if (input.projectTypes !== undefined) patch.project_types = input.projectTypes
  if (input.dailyBudgetMin !== undefined) patch.daily_budget_min = input.dailyBudgetMin
  if (input.dailyBudgetMax !== undefined) patch.daily_budget_max = input.dailyBudgetMax
  if (input.languages !== undefined) patch.languages = input.languages
  if (input.imdbLink !== undefined) patch.imdb_link = input.imdbLink
  if (input.portfolioLinks !== undefined) patch.portfolio_links = input.portfolioLinks
  if (input.pastProjects !== undefined) patch.past_projects = input.pastProjects
  if (input.referredBy !== undefined) patch.referred_by = input.referredBy
  if (input.contactWhatsApp !== undefined) patch.contact_whatsapp = input.contactWhatsApp
  if (input.termsAgreed !== undefined) patch.terms_agreed = input.termsAgreed
  if (input.completed !== undefined) patch.completed = input.completed
  if (input.subscriptionTier !== undefined) patch.subscription_tier = input.subscriptionTier
  if (input.trialEnds !== undefined) patch.trial_ends = iso(input.trialEnds)
  return patch
}

export async function updateByUserId(userId: string, input: UpdateCrewProfileInput, _req: Requester): Promise<CrewProfileRow | null> {
  const { data, error } = await getServiceClient()
    .from('crew_profiles')
    .update(buildCrewPatch(input))
    .eq('userId', userId)
    .select(CREW_COLS)
    .maybeSingle()
  throwOnError('crewProfile.updateByUserId', error)
  return data ? mapCrewProfile(data as Record<string, unknown>) : null
}

export async function updateById(id: string, input: UpdateCrewProfileInput, _req: Requester): Promise<CrewProfileRow | null> {
  const { data, error } = await getServiceClient()
    .from('crew_profiles')
    .update(buildCrewPatch(input))
    .eq('id', id)
    .select(CREW_COLS)
    .maybeSingle()
  throwOnError('crewProfile.updateById', error)
  return data ? mapCrewProfile(data as Record<string, unknown>) : null
}

// System-only (auth plumbing): drop the placeholder profile when an OAuth
// signup's role is corrected (see src/app/auth/callback/route.ts).
export async function deleteByUserId(userId: string, _req: Requester): Promise<void> {
  const { error } = await getServiceClient().from('crew_profiles').delete().eq('userId', userId)
  throwOnError('crewProfile.deleteByUserId', error)
}

export interface CreateCrewProfileInput {
  userId: string
  photo?: string | null
  city?: string | null
  budgetRangeMin?: number | null
  budgetRangeMax?: number | null
  budgetFlexible?: boolean
  primaryRoles?: string[]
  yearsExperience?: string | null
  location?: string | null
  availableToTravel?: boolean
  availability?: boolean
  availabilityStart?: Date | string | null
  availabilityEnd?: Date | string | null
  projectTypes?: string[]
  dailyBudgetMin?: number | null
  dailyBudgetMax?: number | null
  languages?: string[] | Record<string, unknown>
  imdbLink?: string | null
  portfolioLinks?: string[]
  pastProjects?: unknown | null
  referredBy?: string | null
  contactWhatsApp?: string | null
  termsAgreed?: boolean
  completed?: boolean
  subscriptionTier?: string
  trialEnds?: Date | string | null
}

export async function create(input: CreateCrewProfileInput, _req: Requester): Promise<CrewProfileRow> {
  const { data, error } = await getServiceClient()
    .from('crew_profiles')
    .insert({
      userId: input.userId,
      photo: input.photo ?? null,
      city: input.city ?? null,
      budget_range_min: input.budgetRangeMin ?? null,
      budget_range_max: input.budgetRangeMax ?? null,
      budgetFlexible: input.budgetFlexible ?? false,
      primary_roles: input.primaryRoles ?? [],
      years_experience: input.yearsExperience ?? null,
      location: input.location ?? null,
      available_to_travel: input.availableToTravel ?? false,
      availability: input.availability ?? true,
      availability_start: iso(input.availabilityStart),
      availability_end: iso(input.availabilityEnd),
      project_types: input.projectTypes ?? [],
      daily_budget_min: input.dailyBudgetMin ?? null,
      daily_budget_max: input.dailyBudgetMax ?? null,
      languages: input.languages ?? [],
      imdb_link: input.imdbLink ?? null,
      portfolio_links: input.portfolioLinks ?? [],
      past_projects: input.pastProjects ?? null,
      referred_by: input.referredBy ?? null,
      contact_whatsapp: input.contactWhatsApp ?? null,
      terms_agreed: input.termsAgreed ?? false,
      completed: input.completed ?? false,
      subscription_tier: input.subscriptionTier ?? 'FREE_TRIAL',
      trial_ends: iso(input.trialEnds),
      created_at: now().toISOString(),
      updated_at: now().toISOString(),
    })
    .select(CREW_COLS)
    .single()
  throwOnError('crewProfile.create', error)
  return mapCrewProfile(data as Record<string, unknown>)
}

export interface CrewSearchFilters {
  search?: string
  city?: string | null
  roles?: string[]
  availableOnly?: boolean
  userRole?: UserRole
  take?: number
  skip?: number
  orderBy?: 'createdAt' | 'updatedAt'
}

export async function findManyWithUser(filters: CrewSearchFilters = {}): Promise<CrewProfileWithUserRow[]> {
  // Embed-filtered query (user.role below) — must use the !inner variant.
  let q = crewQueryInner().order(filters.orderBy === 'createdAt' ? 'created_at' : 'updated_at', { ascending: false })
  if (filters.availableOnly) q = q.eq('availability', true)
  if (filters.city) q = q.ilike('city', `%${filters.city}%`)
  if (filters.userRole) q = q.eq('user.role', filters.userRole)
  if (filters.search) {
    q = q.or(`city.ilike.%${filters.search}%,location.ilike.%${filters.search}%`)
  }
  if (filters.take) {
    const skip = filters.skip ?? 0
    q = q.range(skip, skip + filters.take - 1)
  }
  const { data, error } = await q
  throwOnError('crewProfile.findManyWithUser', error)
  return (data ?? []).map((r) => toCrewWithUser(r as Record<string, unknown>))
}

export async function findById(id: string): Promise<CrewProfileRow | null> {
  const { data, error } = await getServiceClient().from('crew_profiles').select(CREW_COLS).eq('id', id).maybeSingle()
  throwOnError('crewProfile.findById', error)
  return data ? mapCrewProfile(data as Record<string, unknown>) : null
}

// Admin dashboard: completed-profile count.
export async function countCompleted(_req: Requester): Promise<number> {
  const { count, error } = await getServiceClient()
    .from('crew_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('completed', true)
  throwOnError('crewProfile.countCompleted', error)
  return count ?? 0
}

// Slug resolution (api/crew/[id]): exact case-insensitive user-name match.
// `ilike` without wildcards == case-insensitive equals.
export async function findFirstByUserNameExact(name: string): Promise<CrewProfileWithUserRow | null> {
  const { data, error } = await crewQueryInner().ilike('user.name', name).limit(1).maybeSingle()
  throwOnError('crewProfile.findFirstByUserNameExact', error)
  return data ? toCrewWithUser(data as Record<string, unknown>) : null
}

// Slug resolution fallback: every word must appear in the user's name
// (case-insensitive contains); repeated filters on the same column AND.
export async function findFirstByUserNameContainsAll(words: string[]): Promise<CrewProfileWithUserRow | null> {
  let q = crewQueryInner()
  for (const w of words) q = q.ilike('user.name', `%${w}%`)
  const { data, error } = await q.limit(1).maybeSingle()
  throwOnError('crewProfile.findFirstByUserNameContainsAll', error)
  return data ? toCrewWithUser(data as Record<string, unknown>) : null
}

export type { CrewProfileRow, CrewProfileWithUserRow }