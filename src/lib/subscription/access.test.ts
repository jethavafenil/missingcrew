import { describe, expect, it } from 'vitest'
import { hasProBadge, isTrialActive, monthlyApplicationLimit, trialEndsFromNow, TRIAL_DAYS } from '@/lib/subscription/access'

const now = new Date('2026-10-19T00:00:00Z')
const future = new Date('2026-12-01T00:00:00Z')
const past = new Date('2026-09-01T00:00:00Z')

describe('crew access rules', () => {
  it('trialEndsFromNow adds the trial length', () => {
    const end = trialEndsFromNow(now)
    expect(Math.round((end.getTime() - now.getTime()) / 86_400_000)).toBe(TRIAL_DAYS)
  })

  it('active trial: PRO badge + unlimited applications', () => {
    const crew = { subscriptionTier: 'FREE_TRIAL', trialEnds: future }
    expect(isTrialActive(crew, now)).toBe(true)
    expect(hasProBadge(crew, now)).toBe(true)
    expect(monthlyApplicationLimit(crew, now)).toBe(Infinity)
  })

  it('expired or missing trial falls back to the free limit and no badge', () => {
    for (const crew of [
      { subscriptionTier: 'FREE_TRIAL', trialEnds: past },
      { subscriptionTier: 'FREE_TRIAL', trialEnds: null },
      { subscriptionTier: 'BASIC', trialEnds: future },
    ]) {
      expect(hasProBadge(crew, now)).toBe(false)
      expect(monthlyApplicationLimit(crew, now)).toBe(10)
    }
  })

  it('PRO is always unlimited with the badge', () => {
    const crew = { subscriptionTier: 'PRO', trialEnds: null }
    expect(hasProBadge(crew, now)).toBe(true)
    expect(monthlyApplicationLimit(crew, now)).toBe(Infinity)
  })

  it('tolerates string dates from cached JSON', () => {
    expect(isTrialActive({ subscriptionTier: 'FREE_TRIAL', trialEnds: future.toISOString() }, now)).toBe(true)
  })
})
