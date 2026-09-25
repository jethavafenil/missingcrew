import 'server-only'
import { env, requireEnv } from '@/lib/env'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// RLS note (see docs/supabase-migration-design.md §3): `service_role` bypasses
// RLS, so ALL user-scoping and admin-gating is enforced in this repo layer
// (explicit filters + Requester role checks). Public-read functions may pass a
// non-service client so RLS policies apply to anon reads.
//
// The app authenticates with Supabase Auth (GoTrue); callers pass
// `Requester { userId, role }` derived from `session.user`.

const globalForSupabase = globalThis as unknown as {
  anonClient?: SupabaseClient
  serviceClient?: SupabaseClient
}

export function getAnonClient(): SupabaseClient {
  if (globalForSupabase.anonClient) return globalForSupabase.anonClient
  const url = requireEnv(env.SUPABASE_URL, 'SUPABASE_URL')
  const key = requireEnv(env.SUPABASE_ANON_KEY, 'SUPABASE_ANON_KEY')
  globalForSupabase.anonClient = createClient(url, key)
  return globalForSupabase.anonClient
}

export function getServiceClient(): SupabaseClient {
  if (globalForSupabase.serviceClient) return globalForSupabase.serviceClient
  const url = requireEnv(env.SUPABASE_URL, 'SUPABASE_URL')
  const key = requireEnv(env.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY')
  globalForSupabase.serviceClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return globalForSupabase.serviceClient
}

export type { SupabaseClient }