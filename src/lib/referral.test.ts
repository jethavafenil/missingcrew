import { describe, it, expect } from 'vitest'
import { buildReferralLink, isEmailLike, isValidReferralCode } from './referral'

describe('referral helpers', () => {
  it('builds a signup link with the code and no email', () => {
    expect(buildReferralLink('https://site.com/', 'abc-123')).toBe('https://site.com/accounts?tab=signup&role=crew&ref=abc-123')
  })
  it('accepts ids and rejects anything else', () => {
    expect(isValidReferralCode('ea192e24-a672-4774-a522-9a3d51aa7e5f')).toBe(true)
    for (const bad of ['', 'a b', 'x;drop', 'a@b.com', 'x'.repeat(65), null, 5]) expect(isValidReferralCode(bad)).toBe(false)
  })
  it('tells emails from codes', () => {
    expect(isEmailLike('a@b.com')).toBe(true)
    expect(isEmailLike('abc-123')).toBe(false)
  })
})
