import { createSupabaseBrowserClient as createAuthClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/repo/types'
import type { AppSession, SessionUser } from '@/lib/auth/types'
import { setSignInVerifying } from '@/lib/auth/auth-flags'

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
  // Set when the credentials are valid but belong to the other kind of account.
  wrongRole?: UserRole
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
  setSignInVerifying(true)
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { ok: false, error: friendlyAuthError(error.message) }
    if (!data.session) {
      return { ok: false, error: 'Email not verified. Please check your email for a verification link.' }
    }

    if (expectedRole) {
      const res = await fetch('/api/auth/session', { cache: 'no-store' })
      const session: AppSession | null = res.ok ? await res.json() : null
      if (session?.user && session.user.role !== expectedRole && session.user.role !== 'ADMIN') {
        await supabase.auth.signOut()
        const actual = session.user.role
        return {
          ok: false,
          wrongRole: actual,
          error:
            actual === 'EMPLOYER'
              ? 'This email belongs to a Producer / Client account. Please sign in using the Producer login.'
              : 'This email belongs to a Crew account. Please sign in using the Crew login.',
        }
      }
    }

    return { ok: true, url: callbackUrl }
  } finally {
    // Give the auth-state listeners a moment to settle before pages react again.
    setTimeout(() => setSignInVerifying(false), 1500)
  }
}
