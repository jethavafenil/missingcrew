// Referral links: /accounts?tab=signup&role=crew&ref=<referrer crew profile id>.
// The id (not the email) goes in the link so nobody's address is exposed. The new member's
// browser remembers it until they finish their profile; the server then rewards the referrer.

export const REFERRAL_STORAGE_KEY = 'mc_ref'

// Same charset as every other id in the app (cuid + uuid).
const REF_RE = /^[A-Za-z0-9_-]{1,64}$/

export function isValidReferralCode(value: unknown): value is string {
  return typeof value === 'string' && REF_RE.test(value)
}

export function buildReferralLink(origin: string, crewProfileId: string): string {
  return `${origin.replace(/\/+$/, '')}/accounts?tab=signup&role=crew&ref=${encodeURIComponent(crewProfileId)}`
}

export function rememberReferral(code: unknown): void {
  if (!isValidReferralCode(code)) return
  try {
    window.localStorage.setItem(REFERRAL_STORAGE_KEY, code)
  } catch {
    // storage blocked: the member can still type the referrer's email in their profile
  }
}

export function recalledReferral(): string {
  try {
    const v = window.localStorage.getItem(REFERRAL_STORAGE_KEY)
    return isValidReferralCode(v) ? v : ''
  } catch {
    return ''
  }
}

// What the profile form stores: an email, or a referral code.
export function isEmailLike(value: string): boolean {
  return value.includes('@')
}
