import { describe, it, expect } from 'vitest'
import { buildCustomDuration, formatProductionStatus, formatShootDuration, parseCustomDuration } from './details'

describe('parseCustomDuration / buildCustomDuration', () => {
  it('accepts whole numbers with a known unit', () => {
    expect(parseCustomDuration('10 days')).toEqual({ value: 10, unit: 'days' })
    expect(buildCustomDuration(6, 'weeks')).toBe('6 weeks')
    expect(buildCustomDuration('3', 'months')).toBe('3 months')
  })
  it('rejects bad numbers, units and limits', () => {
    for (const bad of ['', '0 days', '366 days', '53 weeks', '25 months', '1.5 days', '-2 days', '3 years', 'ten days', null, 5]) {
      expect(parseCustomDuration(bad as string)).toBeNull()
    }
    expect(buildCustomDuration(2.5, 'days')).toBeNull()
    expect(buildCustomDuration('abc', 'days')).toBeNull()
  })
})

describe('formatShootDuration', () => {
  it('shows the preset label', () => {
    expect(formatShootDuration('1-3_days', null)).toBe('1–3 days')
    expect(formatShootDuration('3-4_weeks', null)).toBe('3–4 weeks')
  })
  it('shows a custom value with the right singular/plural', () => {
    expect(formatShootDuration('custom', '10 days')).toBe('10 days')
    expect(formatShootDuration('custom', '1 weeks')).toBe('1 week')
    expect(formatShootDuration('custom', '6 weeks')).toBe('6 weeks')
    expect(formatShootDuration('custom', 'garbage')).toBe('Custom duration')
    expect(formatShootDuration('custom', null)).toBe('Custom duration')
  })
  it('is empty when nothing is chosen or the value is unknown', () => {
    expect(formatShootDuration(null, null)).toBeNull()
    expect(formatShootDuration('forever', null)).toBeNull()
  })
})

describe('formatProductionStatus', () => {
  it('maps values to labels', () => {
    expect(formatProductionStatus('FUNDING_SECURED')).toBe('Funding secured')
    expect(formatProductionStatus('AWAITING_APPROVAL')).toBe('Awaiting approval')
    expect(formatProductionStatus(null)).toBeNull()
    expect(formatProductionStatus('OTHER')).toBeNull()
  })
})
