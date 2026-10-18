// Shared password policy: used by the signup forms (live feedback) and by the
// register API routes (authoritative server-side check).

export interface PasswordRequirements {
  length: boolean
  uppercase: boolean
  lowercase: boolean
  number: boolean
  specialChar: boolean
}

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128

export function getPasswordRequirements(password: string): PasswordRequirements {
  return {
    length: password.length >= PASSWORD_MIN_LENGTH,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    specialChar: /[^A-Za-z0-9]/.test(password),
  }
}

export function isStrongPassword(password: string): boolean {
  return Object.values(getPasswordRequirements(password)).every(Boolean)
}

export const PASSWORD_POLICY_MESSAGE =
  'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number and a special character.'
