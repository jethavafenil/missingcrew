import 'server-only'
import { getServiceClient } from '@/lib/repo/client'
import type { UserRole } from '@/lib/repo/types'

// Service-role Supabase Auth admin API. Server-only: creates/updates auth
// users and maintains the role claim (auth.users.app_metadata.role), which
// custom_access_token_hook (migration 0003) copies into every JWT.

export function getAdminAuthClient() {
  return getServiceClient().auth.admin
}

// Keep auth.users.app_metadata.role and public.users.role in sync. The JWT
// claim is re-issued on the user's next token refresh.
export async function setUserRole(authId: string, role: UserRole) {
  const { error } = await getAdminAuthClient().updateUserById(authId, {
    app_metadata: { role },
  })
  if (error) throw new Error(`admin.setUserRole failed: ${error.message}`)
}
