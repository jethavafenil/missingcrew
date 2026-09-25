import { getSession } from '@/lib/auth/server'
import { requesterFromSession, type Requester, type UserRole } from '@/lib/repo'
import type { AppSession } from '@/lib/auth/types'
import { ApiError } from '@/lib/api/errors'

export type ApiPrincipal = { session: AppSession; requester: Requester }

export async function requireAuth(): Promise<ApiPrincipal> {
  const session = await getSession()
  if (!session) throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED')
  return { session, requester: requesterFromSession(session) }
}

export async function requireRole(role: UserRole): Promise<ApiPrincipal> {
  const principal = await requireAuth()
  if (principal.session.user.role !== role) throw new ApiError(403, 'Forbidden', 'FORBIDDEN')
  return principal
}
