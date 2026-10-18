import { describe, expect, it } from 'vitest'
import { containsLetter, isBeforeToday, isSafeReturnPath, todayInputValue } from '@/lib/utils'
import { isStrongPassword } from '@/lib/auth/password'

describe('isSafeReturnPath', () => {
  it('accepts same-origin paths', () => {
    expect(isSafeReturnPath('/find-work')).toBe(true)
    expect(isSafeReturnPath('/projects/abc?x=1')).toBe(true)
  })
  it('rejects external, protocol-relative and backslash redirects', () => {
    for (const bad of ['//evil.com', '/\\evil.com', 'https://evil.com', 'evil.com', '', null, undefined, '/a\nb']) {
      expect(isSafeReturnPath(bad as string | null | undefined)).toBe(false)
    }
  })
})

describe('isBeforeToday', () => {
  const day = 86_400_000
  it('allows today and future dates', () => {
    expect(isBeforeToday(new Date(Date.now() + 5 * day))).toBe(false)
    expect(isBeforeToday(todayInputValue())).toBe(false)
  })
  it('rejects dates before the timezone tolerance window', () => {
    expect(isBeforeToday(new Date(Date.now() - 3 * day))).toBe(true)
    expect(isBeforeToday('2020-01-01')).toBe(true)
    expect(isBeforeToday('not-a-date')).toBe(true)
  })
})

describe('containsLetter', () => {
  it('rejects phone-number-like names and accepts real names', () => {
    expect(containsLetter('+91972493365')).toBe(false)
    expect(containsLetter('Anton Chigurh')).toBe(true)
    expect(containsLetter('फेनिल')).toBe(true)
  })
})

describe('isStrongPassword', () => {
  it('requires length, upper, lower, number and special character', () => {
    expect(isStrongPassword('Abcdef1!')).toBe(true)
    expect(isStrongPassword('abcdef1!')).toBe(false)
    expect(isStrongPassword('ABCDEF1!')).toBe(false)
    expect(isStrongPassword('Abcdefg!')).toBe(false)
    expect(isStrongPassword('Abcdefg1')).toBe(false)
    expect(isStrongPassword('Ab1!')).toBe(false)
  })
})
