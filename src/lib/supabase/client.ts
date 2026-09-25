import { createBrowserClient } from '@supabase/ssr'
import { publicEnv } from '@/lib/public-env'

// Browser anon client. Use only in Client Components and client-side event
// handlers. Do not import from Server Components.
export function createSupabaseBrowserClient() {
  const url = publicEnv.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createBrowserClient(url, anonKey)
}