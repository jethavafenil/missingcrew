import { describe, it, expect } from 'vitest'
import { emailComposeUrl, whatsappUrl } from './contactLinks'

const DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130'
const PHONE = 'Mozilla/5.0 (Linux; Android 14) Chrome/130 Mobile'

describe('emailComposeUrl', () => {
  it('opens Gmail compose in the browser on desktop', () => {
    const u = emailComposeUrl('a@b.com', DESKTOP, 'Hi there')
    expect(u.startsWith('https://mail.google.com/mail/?')).toBe(true)
    expect(u).toContain('to=a%40b.com')
    expect(u).toContain('su=Hi+there')
  })
  it('uses mailto on phones', () => {
    expect(emailComposeUrl('a@b.com', PHONE, 'Hi there')).toBe('mailto:a@b.com?subject=Hi%20there')
    expect(emailComposeUrl('a@b.com', PHONE)).toBe('mailto:a@b.com')
  })
})

describe('whatsappUrl', () => {
  it('keeps digits only and encodes the text', () => {
    expect(whatsappUrl('+91 98765-43210', 'Hi Sam')).toBe('https://wa.me/919876543210?text=Hi%20Sam')
  })
  it('returns null for junk', () => {
    expect(whatsappUrl('abc')).toBeNull()
  })
})
