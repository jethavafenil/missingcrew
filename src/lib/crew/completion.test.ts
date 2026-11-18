import { describe, expect, it } from 'vitest'
import { profileCompletion } from './completion'

const full = {
  photo: 'data:image/png;base64,x',
  city: 'Mumbai',
  primaryRoles: ['Actor'],
  yearsExperience: '3-5 years',
  availability: true,
  availableToTravel: false,
  availabilityStart: '2026-12-01',
  availabilityEnd: '2026-12-31',
  contactWhatsApp: '9876543210',
  imdbLink: 'https://www.imdb.com/name/nm0000129/',
  portfolioLinks: ['https://example.com'],
  projectTypes: ['Short Film'],
}

describe('profileCompletion', () => {
  it('is 100% with nothing missing for a full profile', () => {
    expect(profileCompletion(full)).toEqual({ percent: 100, missing: [] })
  })
  it('lists exactly what is missing and matches the old 12-field percentage', () => {
    const r = profileCompletion({ ...full, imdbLink: '', availabilityEnd: null })
    expect(r.missing).toEqual(['availEnd', 'imdb'])
    expect(r.percent).toBe(83)
  })
  it('counts a false yes/no answer as answered, an empty list and blank text as missing', () => {
    const r = profileCompletion({ ...full, availableToTravel: false, portfolioLinks: [], contactWhatsApp: '  ' })
    expect(r.missing).toEqual(['whatsapp', 'links'])
  })
  it('treats no profile as everything missing', () => {
    expect(profileCompletion(null).percent).toBe(0)
    expect(profileCompletion(undefined).missing.length).toBe(12)
  })
})
