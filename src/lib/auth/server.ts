import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { userRepo } from '@/lib/repo'
import type { UserRole } from '@/lib/repo/types'
import type { AppSession, SessionUser } from '@/lib/auth/types'

export type { AppSession, SessionUser }

export const SIGN_IN_PATH = '/accounts?tab=signin'

// Cookie-aware server client (RSC + route handlers). Reads/writes the GoTrue
// session cookies so token refreshes persist.
export async function getAuthServerClient() {
  return getSupabaseServerClient()
}

// Resolve the app session: GoTrue user -> public.users row (id, role,
// profiles). Cached per request so RSC trees and nested helpers share one
// lookup. Returns null when there is no auth user or the auth user has no
// app row (pre-backfill identities are treated as signed out).
export const getSession = cache(async (): Promise<AppSession | null> => {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) return null

  const dbUser = await userRepo.findByAuthId(authUser.id)
  if (!dbUser) return null

  // getUser() validates the token server-side; getSession() is a local cookie
  // read used only for the token's expiry timestamp.
  const {
    data: { session: tokenSession },
  } = await supabase.auth.getSession()

  return {
    user: {
      id: dbUser.id,
      authId: authUser.id,
      name: dbUser.name,
      email: dbUser.email,
      image: dbUser.image,
      role: dbUser.role,
      hasProfile: !!(dbUser.crewProfile || dbUser.employerProfile),
      createdAt: dbUser.createdAt,
    },
    expires: tokenSession?.expires_at
      ? new Date(tokenSession.expires_at * 1000).toISOString()
      : new Date(Date.now() + 3600_000).toISOString(),
  }
})

export async function getUser(): Promise<SessionUser | null> {
  const session = await getSession()
  return session?.user ?? null
}

// For pages/layouts: redirects to sign-in when unauthenticated.
export async function requireUser(redirectTo: string = SIGN_IN_PATH): Promise<AppSession> {
  const session = await getSession()
  if (!session) redirect(redirectTo)
  return session
}

// Role-gated variant for pages/layouts (e.g. admin sections).
export async function requireRole(
  role: UserRole,
  options: { signInRedirect?: string; forbiddenRedirect?: string } = {},
): Promise<AppSession> {
  const session = await requireUser(options.signInRedirect)
  if (session.user.role !== role) {
    redirect(options.forbiddenRedirect ?? roleHome(session.user.role))
  }
  return session
}

export function roleHome(role: UserRole): string {
  if (role === 'EMPLOYER') return '/employer/dashboard'
  if (role === 'ADMIN') return '/admin'
  return '/crew-home'
}
