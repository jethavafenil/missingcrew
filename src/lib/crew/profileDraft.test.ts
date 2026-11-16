import { describe, it, expect } from 'vitest'
import { buildDraft, showreelStatus } from './profileDraft'
import { parseShowreel } from './profileFields'

describe('showreel links', () => {
  it('adds https when a link is pasted without it, but still refuses explicit http', () => {
    expect(parseShowreel('youtu.be/dQw4w9WgXcQ')).toEqual({ ok: true, value: 'https://youtu.be/dQw4w9WgXcQ' })
    expect(parseShowreel('www.youtube.com/watch?v=dQw4w9WgXcQ').ok).toBe(true)
    expect(parseShowreel('http://youtu.be/dQw4w9WgXcQ').ok).toBe(false)
    expect(parseShowreel('hello there').ok).toBe(false)
  })
  it('recognises YouTube and Vimeo with a preview, other links as plain links', () => {
    const yt = showreelStatus('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    expect(yt).toMatchObject({ state: 'video', provider: 'youtube', thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg' })
    expect(showreelStatus('vimeo.com/123456')).toMatchObject({ state: 'video', provider: 'vimeo' })
    expect(showreelStatus('https://example.com/reel')).toMatchObject({ state: 'link' })
    expect(showreelStatus('')).toEqual({ state: 'empty' })
    expect(showreelStatus('not a link')).toMatchObject({ state: 'invalid' })
  })
})

describe('buildDraft', () => {
  it('keeps valid values and fixes the link', () => {
    const { data, problems } = buildDraft({ phone: '98765 43210', showreelUrl: 'youtu.be/dQw4w9WgXcQ', city: 'Surat' })
    expect(data.phone).toBe('9876543210')
    expect(data.showreelUrl).toBe('https://youtu.be/dQw4w9WgXcQ')
    expect(data.city).toBe('Surat')
    expect(problems).toEqual({})
  })
  it('leaves half-typed optional values out instead of blocking the save', () => {
    const { data, problems } = buildDraft({ phone: '98765', showreelUrl: 'htt', imdbLink: 'https://www.imdb.com/name/nm12', city: 'Surat' })
    expect('phone' in data).toBe(false)
    expect('showreelUrl' in data).toBe(false)
    expect('imdbLink' in data).toBe(false)
    expect(data.city).toBe('Surat')
    expect(Object.keys(problems).sort()).toEqual(['imdbLink', 'phone', 'showreelUrl'])
  })
  it('lets a cleared field clear on the server', () => {
    const { data } = buildDraft({ phone: '', showreelUrl: '', imdbLink: '' })
    expect(data.phone).toBe('')
    expect(data.showreelUrl).toBe('')
    expect(data.imdbLink).toBe('')
  })
  it('cleans the link list', () => {
    const { data } = buildDraft({ portfolioLinks: ['https://a.com', 'bad', { url: 'https://b.com' }] })
    expect(data.portfolioLinks).toEqual(['https://a.com/', 'https://b.com/'])
  })
})
