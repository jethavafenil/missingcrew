import { describe, it, expect } from 'vitest'
import { cleanDisplayName, normalizeLocationQuery, simplifySuggestions } from './locations'

describe('cleanDisplayName', () => {
  it('removes repeated parts', () => {
    expect(cleanDisplayName('Delhi, Delhi, Delhi, India')).toBe('Delhi, India')
    expect(cleanDisplayName('Surat, Gujarat, India')).toBe('Surat, Gujarat, India')
  })
  it('drops postal codes and district names but keeps the place itself', () => {
    expect(cleanDisplayName('Mumbai, Mumbai Suburban District, Maharashtra, 400051, India')).toBe('Mumbai, Maharashtra, India')
    expect(cleanDisplayName('Surat, Katargam Taluka, Gujarat, 395008, India')).toBe('Surat, Gujarat, India')
    expect(cleanDisplayName('Multai, Multai Tahsil, Madhya Pradesh, India')).toBe('Multai, Madhya Pradesh, India')
    expect(cleanDisplayName('400051')).toBe('400051')
  })
})

describe('normalizeLocationQuery', () => {
  it('accepts normal searches and trims them', () => {
    expect(normalizeLocationQuery('  Mum  bai ')).toBe('Mum bai')
  })
  it('rejects empty, one-letter, too long and missing input', () => {
    for (const bad of ['', ' ', 'a', null, undefined, 'x'.repeat(81)]) expect(normalizeLocationQuery(bad as string)).toBeNull()
  })
  it('strips control characters', () => {
    expect(normalizeLocationQuery('Pu\nne')).toBe('Pu ne')
  })
})

describe('simplifySuggestions', () => {
  it('keeps the needed fields, cleans names and drops duplicates', () => {
    const out = simplifySuggestions([
      { place_id: '1', display_name: 'Mumbai, Mumbai, Maharashtra, India', lat: '19.07', lon: '72.87', extra: 'x' },
      { place_id: '2', display_name: 'Mumbai, Maharashtra, India', lat: '19.07', lon: '72.87' },
      { place_id: '3', display_name: 'Mumbra, Thane, India', lat: '19.1', lon: '73' },
    ])
    expect(out.map((o) => o.display_name)).toEqual(['Mumbai, Maharashtra, India', 'Mumbra, Thane, India'])
    expect(Object.keys(out[0]).sort()).toEqual(['display_name', 'lat', 'lon', 'place_id'])
  })
  it('is safe on junk', () => {
    expect(simplifySuggestions(null)).toEqual([])
    expect(simplifySuggestions([null, 5, {}])).toEqual([])
  })
})
