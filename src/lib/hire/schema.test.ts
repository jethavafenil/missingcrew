import { describe, expect, it } from 'vitest'
import { createHireRequestSchema, respondHireRequestSchema, MAX_HIRE_MESSAGE } from '@/lib/hire/schema'
import { createHireRequestEmail, createHireResponseEmail } from '@/lib/email'
import { formatShootRange } from '@/lib/projects/format'

describe('hire request schema', () => {
  const base = { crewId: 'abc123', projectId: 'p-1_x', message: ' Hello ' }
  it('accepts a normal request and trims the message', () => {
    const r = createHireRequestSchema.safeParse({ ...base, role: '' })
    expect(r.success && r.data.message).toBe('Hello')
    expect(r.success && r.data.role).toBeUndefined()
  })
  it('rejects empty/oversized messages and unsafe ids', () => {
    expect(createHireRequestSchema.safeParse({ ...base, message: '   ' }).success).toBe(false)
    expect(createHireRequestSchema.safeParse({ ...base, message: 'x'.repeat(MAX_HIRE_MESSAGE + 1) }).success).toBe(false)
    expect(createHireRequestSchema.safeParse({ ...base, crewId: 'a,b' }).success).toBe(false)
    expect(createHireRequestSchema.safeParse({ ...base, projectId: '' }).success).toBe(false)
  })
  it('respond schema only allows the three outcomes', () => {
    for (const status of ['ACCEPTED', 'DECLINED', 'CANCELLED']) expect(respondHireRequestSchema.safeParse({ status }).success).toBe(true)
    expect(respondHireRequestSchema.safeParse({ status: 'PENDING' }).success).toBe(false)
    expect(respondHireRequestSchema.safeParse({ status: 'HIRED' }).success).toBe(false)
  })
})

describe('hire emails', () => {
  it('escape producer-controlled text', () => {
    const { html } = createHireRequestEmail('Asha', '<b>Prod</b>', 'Neon', 'Gaffer', '<script>alert(1)</script>')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('/dashboard?tab=requests')
  })
  it('response email reflects accept/decline', () => {
    expect(createHireResponseEmail('P', 'C', 'Neon', true).subject).toContain('accepted')
    expect(createHireResponseEmail('P', 'C', 'Neon', false).subject).toContain('declined')
  })
})

describe('formatShootRange same day', () => {
  it('shows a single date for one-day shoots', () => {
    expect(formatShootRange('2026-11-05T10:00:00Z', '2026-11-05T12:00:00Z')).not.toContain(' - ')
  })
})
