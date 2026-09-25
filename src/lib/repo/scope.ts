import type { Requester } from '@/lib/repo/types'

// Identity helpers for the repo layer. Every repo call is RLS-enforced in app
// code (service-role bypasses RLS by design — see docs/supabase-migration-design.md §3).
export function assertUser(req: Requester | undefined): RequiresRequester {
  if (!req?.userId) throw new Error('Authentication required for this operation')
  return req as RequiresRequester
}

export function assertAdmin(req: Requester | undefined): RequiresAdmin {
  if (!req?.userId || req.role !== 'ADMIN') throw new Error('Admin permissions required')
  return req as RequiresAdmin
}

export type RequiresRequester = Requester & { userId: string }
export type RequiresAdmin = RequiresRequester & { role: 'ADMIN' }

export function currentUserId(req: RequiresRequester): string {
  return req.userId
}

// Build a Requester from the Supabase Auth-backed app session (src/lib/auth/server.ts).
// Role falls back to 'CREW' (user-scoped repo calls are authorized by the
// explicit userId filter, not the role value).
export function requesterFromSession(session: { user?: { id?: string | null; role?: string | null } } | null | undefined): Requester {
  const userId = session?.user?.id
  if (!userId) throw new Error('Authentication required for this operation')
  const role = session.user!.role === 'EMPLOYER' ? 'EMPLOYER' : session.user!.role === 'ADMIN' ? 'ADMIN' : 'CREW'
  return { userId, role }
}

// Internal/system operations (auth plumbing, background jobs). Service-role.
export const SYSTEM_REQUESTER: RequiresAdmin = { userId: '*system*', role: 'ADMIN' }