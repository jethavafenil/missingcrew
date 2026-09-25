import { describe, expect, it } from 'vitest'
import { now, throwOnError, iso } from '@/lib/repo/helpers'
import type { PostgrestError } from '@supabase/supabase-js'

describe('throwOnError', () => {
  it('passes through when error is null', () => {
    expect(() => throwOnError('repo.fn', null)).not.toThrow()
  })

  it('throws a labelled error carrying the PostgREST message', () => {
    const err = { message: 'row-level security policy', details: 'policy "own rows" violated' } as PostgrestError
    expect(() => throwOnError('repo.update', err)).toThrowError('repo.update: row-level security policy')
  })
})

describe('iso', () => {
  it('serializes Date to ISO string', () => {
    const d = new Date('2026-09-09T10:30:00.000Z')
    expect(iso(d)).toBe('2026-09-09T10:30:00.000Z')
  })

  it('passes strings through', () => {
    expect(iso('2026-01-01')).toBe('2026-01-01')
  })

  it('returns null for null/undefined', () => {
    expect(iso(null)).toBeNull()
    expect(iso(undefined)).toBeNull()
  })
})

describe('now', () => {
  it('returns the current time', () => {
    const before = Date.now()
    const t = now().getTime()
    const after = Date.now()
    expect(t).toBeGreaterThanOrEqual(before)
    expect(t).toBeLessThanOrEqual(after)
  })
})
