import { describe, it, expect } from 'vitest'
import { isValidPhone, normalizePhone } from './phone'

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
