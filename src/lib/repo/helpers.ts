import type { PostgrestError } from '@supabase/supabase-js'

export function now(): Date {
  return new Date()
}

export function throwOnError(label: string, error: PostgrestError | null): void {
  if (error) throw new Error(`${label}: ${error.message} (${error.details ?? ''})`)
}

export function iso(v: Date | string | null | undefined): string | null {
  if (v == null) return null
  return v instanceof Date ? v.toISOString() : String(v)
}

// PostgREST returns reverse-direction embeds (child table -> e.g.
// users -> crew_profiles/employer_profiles) as ARRAYS, because the child FK
// is not UNIQUE so it cannot assume a to-one relation: [] when no row,
// [row] when one. Embeds toward a parent PK return objects. Normalize either
// shape to a single row or null before mapping.
export function firstOrNull(v: unknown): Record<string, unknown> | null {
  if (Array.isArray(v)) return (v[0] as Record<string, unknown>) ?? null
  return (v as Record<string, unknown> | null | undefined) ?? null
}