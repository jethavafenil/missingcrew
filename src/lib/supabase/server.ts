import 'server-only'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { env } from '@/lib/env'

interface CookieMethods {
  getAll(): { name: string; value: string }[] | Promise<{ name: string; value: string }[]>
  setAll(
    cookiesToSet: { name: string; value: string; options: CookieOptions }[],
    headers: Record<string, string>,
  ): void | Promise<void>
}

// Low-level factory for RSC, route handlers, and middleware. Each caller
// supplies its own cookie read/write strategy (see updateSession below and
// the per-caller helpers in P5).
export function createSupabaseServerClient(cookieMethods: CookieMethods) {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: cookieMethods,
  })
}

// Convenience for Server Components and API route handlers using Next's
// cookies() store. Must be awaited.
export async function getSupabaseServerClient() {
  const cookieStore = await cookies()

  return createSupabaseServerClient({
    getAll() {
      return cookieStore.getAll()
    },
    setAll(cookiesToSet, _headers) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options),
        )
      } catch {
        // Called from a Server Component; safe to ignore when middleware
        // already refreshed the session.
      }
    },
  })
}