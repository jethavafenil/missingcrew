import { describe, it, expect } from 'vitest'
import { hasProBadge, monthlyApplicationLimit, FREE_MONTHLY_APPLICATIONS } from './access'

const expired = { subscriptionTier: 'FREE_TRIAL', trialEnds: new Date(Date.now() - 86400000) }
const active = { subscriptionTier: 'FREE_TRIAL', trialEnds: new Date(Date.now() + 86400000 * 10) }
const basic = { subscriptionTier: 'BASIC', trialEnds: null }

describe('plans ON (default)', () => {
  it('limits crew without a trial or PRO to the monthly cap', () => {
    expect(monthlyApplicationLimit(expired)).toBe(FREE_MONTHLY_APPLICATIONS)
    expect(monthlyApplicationLimit(basic)).toBe(FREE_MONTHLY_APPLICATIONS)
  })
  it('keeps trial and PRO unlimited with the badge', () => {
    expect(monthlyApplicationLimit(active)).toBe(Infinity)
    expect(hasProBadge(active)).toBe(true)
    expect(hasProBadge(expired)).toBe(false)
  })
})

describe('plans OFF (free mode)', () => {
  it('everyone applies without a limit and gets the PRO badge', () => {
    for (const crew of [expired, basic, active]) {
      expect(monthlyApplicationLimit(crew, new Date(), false)).toBe(Infinity)
      expect(hasProBadge(crew, new Date(), false)).toBe(true)
    }
  })
})
