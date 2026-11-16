// Mobile number check for signup forms: 8-15 digits, optional leading +, spaces/dashes/brackets allowed.

export function normalizePhone(raw: string): string {
  const trimmed = raw.trim()
  const plus = trimmed.startsWith('+') ? '+' : ''
  return plus + trimmed.replace(/\D/g, '')
}

export function isValidPhone(raw: string): boolean {
  if (!/^\+?[\d\s\-()]+$/.test(raw.trim())) return false
  const digits = raw.replace(/\D/g, '')
  return digits.length >= 8 && digits.length <= 15
}

export const PHONE_MESSAGE = 'Enter a valid mobile number (8-15 digits, with country code if outside India)'

// ---------------------------------------------------------------------------------------------
// Crew mobile numbers: exactly 10 digits (India). Stored without a country code.
// ---------------------------------------------------------------------------------------------
export const MOBILE_LENGTH = 10
export const MOBILE_MESSAGE = 'Enter a 10-digit mobile number'

// "+91 98765 43210", "919876543210", "09876543210" and "9876543210" all become "9876543210".
// Anything that cannot be a 10-digit number gives "".
export function toNationalMobile(raw: string | null | undefined): string {
  const d = (raw || '').replace(/\D/g, '')
  if (d.length === 10) return d
  if (d.length === 12 && d.startsWith('91')) return d.slice(2)
  if (d.length === 11 && d.startsWith('0')) return d.slice(1)
  return ''
}

export function isNationalMobile(raw: string | null | undefined): boolean {
  return /^\d{10}$/.test((raw || '').trim())
}

// For the input box: digits only, never more than 10. A pasted number with +91 or a leading 0 is
// reduced to its 10 digits instead of being cut off at the wrong place.
export function sanitizeMobileInput(raw: string): string {
  const d = raw.replace(/\D/g, '')
  if (d.length <= MOBILE_LENGTH) return d
  return toNationalMobile(d) || d.slice(0, MOBILE_LENGTH)
}

// SMS and WhatsApp need the country code.
export function toE164India(tenDigits: string): string {
  return `+91${tenDigits}`
}
