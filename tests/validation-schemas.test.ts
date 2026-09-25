import { describe, expect, it } from 'vitest'
import { z } from 'zod'

// The register schemas are inline in the route handlers; re-declared here as
// the canonical shapes. Keep in sync with src/app/api/auth/register/*/route.ts.
const crewRegisterSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email().max(254),
  password: z.string().min(8).max(128),
})

const applySchema = z.object({
  answers: z.array(z.string().max(2000)).min(1),
  notes: z.string().max(2000).optional(),
})

describe('auth register schema (crew/employer)', () => {
  it('accepts a valid registration payload', () => {
    expect(crewRegisterSchema.safeParse({
      name: 'Ada Lovelace', email: 'ada@example.com', password: 'Passw0rd!',
    }).success).toBe(true)
  })

  it('trims the name but rejects empty/whitespace-only names', () => {
    const parsed = crewRegisterSchema.safeParse({ name: '  Ada ', email: 'a@b.co', password: 'longenough' })
    expect(parsed.success && parsed.data.name).toBe('Ada')
    expect(crewRegisterSchema.safeParse({ name: '   ', email: 'a@b.co', password: 'longenough' }).success).toBe(false)
  })

  it('rejects malformed emails', () => {
    for (const email of ['not-an-email', 'a@b', '@b.co', 'a b@c.co']) {
      expect(crewRegisterSchema.safeParse({ name: 'A', email, password: 'longenough' }).success).toBe(false)
    }
  })

  it('rejects short and oversized passwords', () => {
    expect(crewRegisterSchema.safeParse({ name: 'A', email: 'a@b.co', password: 'short' }).success).toBe(false)
    expect(crewRegisterSchema.safeParse({ name: 'A', email: 'a@b.co', password: 'x'.repeat(129) }).success).toBe(false)
  })

  it('ignores unknown extra fields', () => {
    const parsed = crewRegisterSchema.safeParse({ name: 'A', email: 'a@b.co', password: 'longenough', role: 'ADMIN' })
    expect(parsed.success && (parsed.data as Record<string, unknown>).role).toBeUndefined()
  })
})

describe('application apply schema', () => {
  it('requires at least one answer', () => {
    expect(applySchema.safeParse({ answers: [] }).success).toBe(false)
    expect(applySchema.safeParse({ answers: [''] }).success).toBe(true)
  })

  it('rejects oversized answers and notes', () => {
    expect(applySchema.safeParse({ answers: ['x'.repeat(2001)] }).success).toBe(false)
    expect(applySchema.safeParse({ answers: ['ok'], notes: 'y'.repeat(2001) }).success).toBe(false)
  })
})
