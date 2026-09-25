/**
 * Shared Supabase helper for ops scripts (CommonJS).
 *
 * Mirrors src/lib/repo/client.ts: a service-role client that bypasses RLS.
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment
 * (loaded from .env via dotenv by the calling script).
 *
 * Also exposes small mapping helpers shared by the export/import scripts.
 * DB column naming is mixed (snake_case mostly, but "userId", "phoneVerified",
 * "budgetFlexible" are camelCase columns) — see the repo layer column constants.
 */

const { createClient } = require('@supabase/supabase-js')

function getSupabaseServiceClient(overrides = {}) {
  const url = overrides.url || process.env.SUPABASE_URL
  const key = overrides.key || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (check your .env)')
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** Unwrap a PostgREST result or throw with a labeled error. */
function unwrap(label, { data, error }) {
  if (error) throw new Error(`${label}: ${error.message}`)
  return data
}

/** Date/null -> ISO string (or null) for insert/update payloads. */
function iso(d) {
  if (d == null) return null
  return d instanceof Date ? d.toISOString() : new Date(d).toISOString()
}

/** Recursively camelize object keys (snake_case -> camelCase). */
function camelizeRow(row) {
  if (Array.isArray(row)) return row.map(camelizeRow)
  if (row && typeof row === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(row)) {
      out[k.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase())] = camelizeRow(v)
    }
    return out
  }
  return row
}

/**
 * Recursively snakelize object keys (camelCase -> snake_case), then restore the
 * camelCase DB columns. Column naming is mixed per table: "userId" is a quoted
 * camelCase column on subscriptions/crew_profiles/employer_profiles (elsewhere
 * it's user_id), users has "phoneVerified", crew_profiles has "budgetFlexible".
 */
const CAMEL_COLS_BY_TABLE = {
  users: ['phoneVerified'],
  subscriptions: ['userId'],
  crew_profiles: ['userId', 'budgetFlexible'],
  employer_profiles: ['userId'],
}

function toDbRow(row, table) {
  if (Array.isArray(row)) return row.map((r) => toDbRow(r, table))
  if (row && typeof row === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(row)) {
      out[k.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase())] = toDbRow(v, table)
    }
    for (const col of CAMEL_COLS_BY_TABLE[table] ?? []) {
      const snake = col.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase())
      if (snake in out) {
        out[col] = out[snake]
        delete out[snake]
      }
    }
    return out
  }
  return row
}

/**
 * accounts table: DB uses snake_case for the NextAuth token columns
 * (refresh_token, access_token, ...) which the export format keeps as-is.
 */
function mapAccountRow(a) {
  return {
    id: a.id,
    userId: a.user_id,
    type: a.type,
    provider: a.provider,
    providerAccountId: a.provider_account_id,
    refresh_token: a.refresh_token,
    access_token: a.access_token,
    expires_at: a.expires_at,
    token_type: a.token_type,
    scope: a.scope,
    id_token: a.id_token,
    session_state: a.session_state,
  }
}

module.exports = {
  getSupabaseServiceClient,
  unwrap,
  iso,
  camelizeRow,
  toDbRow,
  mapAccountRow,
}
