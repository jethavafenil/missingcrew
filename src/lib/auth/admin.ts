import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
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

export function isEmailVerificationRequired(): boolean {
  return env.REQUIRE_EMAIL_VERIFICATION === 'true'
}

// Sends (or re-sends) the signup confirmation email through Supabase Auth's
// configured SMTP. Uses the anon key like a browser would; GoTrue only sends to
// existing unconfirmed users and reveals nothing about the account.
export async function sendSignupConfirmation(email: string, redirectTo: string) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) throw new Error('Missing Supabase URL or anon key')
  const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { error } = await client.auth.resend({ type: 'signup', email, options: { emailRedirectTo: redirectTo } })
  if (error) throw new Error(`auth.resend failed: ${error.message}`)
}
