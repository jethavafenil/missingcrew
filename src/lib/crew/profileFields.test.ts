import { describe, it, expect } from 'vitest'
import { parseFirstProject, parseGender, parseShowreel, vimeoId, youtubeId } from './profileFields'

const now = new Date(Date.UTC(2026, 9, 22))

describe('parseGender', () => {
  it('accepts the three values, any case, and empty', () => {
    expect(parseGender('female')).toEqual({ ok: true, value: 'FEMALE' })
    expect(parseGender('')).toEqual({ ok: true, value: null })
  })
  it('rejects anything else', () => {
    expect(parseGender('x').ok).toBe(false)
  })
})

describe('parseFirstProject', () => {
  it('turns a month into the first of that month', () => {
    const r = parseFirstProject('2019-04', now)
    expect(r.ok && r.value?.toISOString()).toBe('2019-04-01T00:00:00.000Z')
  })
  it('rejects the future, nonsense and ancient dates', () => {
    expect(parseFirstProject('2027-01', now).ok).toBe(false)
    expect(parseFirstProject('april', now).ok).toBe(false)
    expect(parseFirstProject('1900-01', now).ok).toBe(false)
    expect(parseFirstProject('2020-13', now).ok).toBe(false)
  })
  it('allows the current month', () => {
    expect(parseFirstProject('2026-10', now).ok).toBe(true)
  })
})

describe('parseShowreel', () => {
  it('requires an https link', () => {
    expect(parseShowreel('https://youtu.be/abcdefghijk').ok).toBe(true)
    expect(parseShowreel('http://youtu.be/abcdefghijk').ok).toBe(false)
    expect(parseShowreel('javascript:alert(1)').ok).toBe(false)
    expect(parseShowreel('not a link').ok).toBe(false)
    expect(parseShowreel('').ok).toBe(true)
  })
})

describe('video ids', () => {
  it('extracts youtube and vimeo ids', () => {
    expect(youtubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(youtubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(vimeoId('https://vimeo.com/123456')).toBe('123456')
    expect(youtubeId('https://example.com')).toBeNull()
  })
})
