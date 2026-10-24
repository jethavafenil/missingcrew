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
