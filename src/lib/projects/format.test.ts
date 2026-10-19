import { describe, expect, it } from 'vitest'
import { formatBudget, formatShootDate, formatShootRange, shootTimestamp } from '@/lib/projects/format'
import { projectInputSchema } from '@/lib/projects/schema'

describe('formatShootRange', () => {
  it('handles both, one or no dates', () => {
    expect(formatShootRange('2026-10-05T00:00:00Z', '2026-10-20T00:00:00Z')).toContain(' - ')
    expect(formatShootRange('2026-10-05T00:00:00Z', null)).toMatch(/^Starts /)
    expect(formatShootRange(null, '2026-10-20T00:00:00Z')).toMatch(/^Until /)
    expect(formatShootRange(null, null)).toBe('Dates flexible')
    expect(formatShootRange('', 'garbage')).toBe('Dates flexible')
  })
  it('formatShootDate and shootTimestamp tolerate nulls', () => {
    expect(formatShootDate(null)).toBe('To be announced')
    expect(shootTimestamp(null)).toBeNull()
    expect(typeof shootTimestamp('2026-10-05')).toBe('number')
  })
})

describe('formatBudget', () => {
  it('formats range, fixed and partial budgets per day', () => {
    expect(formatBudget({ budgetMin: 10000, budgetMax: 20000 })).toBe('₹10,000 - ₹20,000 per day')
    expect(formatBudget({ budgetMin: 15000, budgetMax: 15000, budgetFixed: true })).toBe('₹15,000 per day (fixed)')
    expect(formatBudget({ budgetMin: 10000 })).toBe('From ₹10,000 per day')
    expect(formatBudget({ budgetMax: 20000 })).toBe('Up to ₹20,000 per day')
    expect(formatBudget({})).toBeNull()
  })
})

describe('projectInputSchema', () => {
  const base = {
    projectName: 'Neon Nights',
    projectType: 'Music Video',
    rolesNeeded: ['Director'],
    location: 'Mumbai',
    description: 'desc',
    questions: ['Have you done this before?', '  ', ''],
    contactPreference: ['email'],
  }
  it('accepts a minimal project: dates and budget optional, blank questions dropped', () => {
    const r = projectInputSchema.safeParse({ ...base, shootStartDate: '', shootEndDate: '' })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.shootStartDate).toBeNull()
      expect(r.data.budgetMin).toBeNull()
      expect(r.data.questions).toEqual(['Have you done this before?'])
    }
  })
  it('fixed budget stores the same amount as min and max', () => {
    const r = projectInputSchema.safeParse({ ...base, budgetFixed: true, budgetMin: '15000' })
    expect(r.success && r.data.budgetMax).toBe(15000)
  })
  it('rejects bad ranges, dates, roles and contact methods', () => {
    expect(projectInputSchema.safeParse({ ...base, budgetMin: 20000, budgetMax: 10000 }).success).toBe(false)
    expect(projectInputSchema.safeParse({ ...base, shootStartDate: '2026-12-10', shootEndDate: '2026-12-01' }).success).toBe(false)
    expect(projectInputSchema.safeParse({ ...base, budgetFixed: true }).success).toBe(false)
    expect(projectInputSchema.safeParse({ ...base, rolesNeeded: [] }).success).toBe(false)
    expect(projectInputSchema.safeParse({ ...base, contactPreference: [] }).success).toBe(false)
  })
})
