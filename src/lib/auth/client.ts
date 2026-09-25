import { createSupabaseBrowserClient as createAuthClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/repo/types'
import type { AppSession, SessionUser } from '@/lib/auth/types'

export { createAuthClient }
export type { AppSession, SessionUser }

export interface CredentialsSignInInput {
  email: string
  password: string
  expectedRole?: UserRole
  callbackUrl?: string
}

export interface CredentialsSignInResult {
  ok: boolean
  error?: string
  url?: string
}

function friendlyAuthError(message: string): string {
  if (message.includes('Email not confirmed')) {
    return 'Email not verified. Please check your email for a verification link.'
  }
  if (message.includes('Invalid login credentials')) {
    return 'Invalid email or password'
  }
  return message
}

// Credentials sign-in over GoTrue. When expectedRole is given, a mismatched
// account is signed back out (mirrors the old NextAuth authorize() role check).
export async function signInWithPassword({
  email,
  password,
  expectedRole,
  callbackUrl,
}: CredentialsSignInInput): Promise<CredentialsSignInResult> {
  const supabase = createAuthClient()

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { ok: false, error: friendlyAuthError(error.message) }
  if (!data.session) {
    return { ok: false, error: 'Email not verified. Please check your email for a verification link.' }
  }

  if (expectedRole) {
    const res = await fetch('/api/auth/session', { cache: 'no-store' })
    const session: AppSession | null = res.ok ? await res.json() : null
    if (session?.user && session.user.role !== expectedRole) {
      await supabase.auth.signOut()
      return { ok: false, error: 'Invalid role' }
    }
  }

  return { ok: true, url: callbackUrl }
}
