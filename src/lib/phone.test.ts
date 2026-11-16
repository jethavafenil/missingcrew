import { describe, it, expect } from 'vitest'
import { isNationalMobile, isValidPhone, normalizePhone, sanitizeMobileInput, toE164India, toNationalMobile } from './phone'

describe('phone', () => {
  it('accepts common formats', () => {
    for (const ok of ['9876543210', '+91 98765 43210', '(022) 2345-6789', '+1-202-555-0143']) expect(isValidPhone(ok)).toBe(true)
  })
  it('rejects letters, too short and too long', () => {
    for (const bad of ['', 'abc', '12345', '98765abc10', '1'.repeat(16), 'call me']) expect(isValidPhone(bad)).toBe(false)
  })
  it('normalises to digits with an optional plus', () => {
    expect(normalizePhone(' +91 98765-43210 ')).toBe('+919876543210')
    expect(normalizePhone('(022) 2345')).toBe('0222345')
  })
})

describe('crew mobile numbers (10 digits)', () => {
  it('reduces common formats to 10 digits', () => {
    for (const ok of ['9876543210', '+91 98765 43210', '919876543210', '09876543210', '+91-98765-43210']) expect(toNationalMobile(ok)).toBe('9876543210')
  })
  it('gives nothing for numbers that cannot be 10 digits', () => {
    for (const bad of ['', '12345', '98765432101', '+1 202 555 0143', 'abc', null, undefined]) expect(toNationalMobile(bad as string)).toBe('')
  })
  it('accepts exactly 10 digits only', () => {
    expect(isNationalMobile('9876543210')).toBe(true)
    for (const bad of ['987654321', '98765432100', '+919876543210', '98765 43210', '', null]) expect(isNationalMobile(bad as string)).toBe(false)
  })
  it('keeps typed input to 10 digits and understands pasted +91 numbers', () => {
    expect(sanitizeMobileInput('98a76-5')).toBe('98765')
    expect(sanitizeMobileInput('98765432101234')).toBe('9876543210')
    expect(sanitizeMobileInput('+91 98765 43210')).toBe('9876543210')
    expect(sanitizeMobileInput('09876543210')).toBe('9876543210')
  })
  it('adds the country code for SMS', () => {
    expect(toE164India('9876543210')).toBe('+919876543210')
  })
})
