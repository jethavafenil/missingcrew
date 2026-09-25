import { getServiceClient } from '@/lib/repo/client'
import { now, throwOnError } from '@/lib/repo/helpers'
import {
  mapWishlist,
  mapCrewProfile,
  mapProject,
  mapEmployerProfile,
  mapUser,
  type WishlistRow,
  type CrewProfileWithUserRow,
  type ProjectWithEmployerRow,
} from '@/lib/repo/types'
import type { Requester } from '@/lib/repo/types'

const CREW_EMBED =
  'crew:crew_profiles(id,"userId",photo,city,budget_range_min,budget_range_max,"budgetFlexible",primary_roles,years_experience,location,available_to_travel,availability,availability_start,availability_end,project_types,daily_budget_min,daily_budget_max,languages,imdb_link,portfolio_links,past_projects,referred_by,contact_whatsapp,terms_agreed,subscription_tier,trial_ends,completed,created_at,updated_at,user:users(id,name,email,phone,"phoneVerified"))'

const PROJECT_EMBED =
  'project:projects(*,employer:employer_profiles(id,"userId",company_name,company_website,completed,created_at,updated_at,user:users(id,name,email,image,phone,"phoneVerified")),applications(id))'

const WISHLIST_WITH_EMBED = `id,user_id,crew_id,project_id,created_at,${CREW_EMBED},${PROJECT_EMBED}`

function toCrewWithUser(raw: Record<string, unknown>): CrewProfileWithUserRow {
  const crew = mapCrewProfile(raw)
  return { ...crew, user: raw.user ? mapUser(raw.user as Record<string, unknown>) : undefined }
}

function toProjectWithEmployer(raw: Record<string, unknown>): ProjectWithEmployerRow {
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

function toWishlist(raw: Record<string, unknown>): WishlistRow {
  const w = mapWishlist(raw)
  const crewRaw = raw.crew as Record<string, unknown> | null | undefined
  const projRaw = raw.project as Record<string, unknown> | null | undefined
  return {
    ...w,
    crew: crewRaw ? toCrewWithUser(crewRaw) : null,
    project: projRaw ? toProjectWithEmployer(projRaw) : null,
  }
}

export async function findManyByUserId(userId: string, _req: Requester): Promise<WishlistRow[]> {
  const { data, error } = await getServiceClient()
    .from('wishlists')
    .select(WISHLIST_WITH_EMBED)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  throwOnError('wishlist.findManyByUserId', error)
  return (data ?? []).map((r) => toWishlist(r as Record<string, unknown>))
}

export async function findCrewWishlist(userId: string, crewId: string, _req: Requester): Promise<WishlistRow | null> {
  const { data, error } = await getServiceClient()
    .from('wishlists')
    .select(WISHLIST_WITH_EMBED)
    .eq('user_id', userId)
    .eq('crew_id', crewId)
    .maybeSingle()
  throwOnError('wishlist.findCrewWishlist', error)
  return data ? toWishlist(data as Record<string, unknown>) : null
}

export async function findProjectWishlist(userId: string, projectId: string, _req: Requester): Promise<WishlistRow | null> {
  const { data, error } = await getServiceClient()
    .from('wishlists')
    .select(WISHLIST_WITH_EMBED)
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .maybeSingle()
  throwOnError('wishlist.findProjectWishlist', error)
  return data ? toWishlist(data as Record<string, unknown>) : null
}

export interface AddWishlistInput {
  crewId?: string | null
  projectId?: string | null
}

export async function add(userId: string, input: AddWishlistInput, _req: Requester): Promise<WishlistRow> {
  const { data, error } = await getServiceClient()
    .from('wishlists')
    .insert({
      user_id: userId,
      crew_id: input.crewId ?? null,
      project_id: input.projectId ?? null,
      created_at: now().toISOString(),
    })
    .select(WISHLIST_WITH_EMBED)
    .single()
  throwOnError('wishlist.add', error)
  return toWishlist(data as Record<string, unknown>)
}

export async function removeCrew(userId: string, crewId: string, _req: Requester): Promise<void> {
  const { error } = await getServiceClient().from('wishlists').delete().eq('user_id', userId).eq('crew_id', crewId)
  throwOnError('wishlist.removeCrew', error)
}

export async function removeProject(userId: string, projectId: string, _req: Requester): Promise<void> {
  const { error } = await getServiceClient().from('wishlists').delete().eq('user_id', userId).eq('project_id', projectId)
  throwOnError('wishlist.removeProject', error)
}

export type { WishlistRow }