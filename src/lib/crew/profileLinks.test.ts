import { describe, it, expect } from 'vitest'
import { MAX_PROFILE_LINKS, cleanLink, collectProfileLinks, pickAllowedLinks, sanitizeProfileLinks } from './profileLinks'

describe('cleanLink', () => {
  it('accepts http(s) and adds https when missing', () => {
    expect(cleanLink('https://vimeo.com/123')).toBe('https://vimeo.com/123')
    expect(cleanLink('vimeo.com/123')).toBe('https://vimeo.com/123')
    expect(cleanLink('  http://example.com ')).toBe('http://example.com/')
  })
  it('rejects junk, scripts and hostless text', () => {
    for (const bad of ['', 'javascript:alert(1)', 'not a link', 'ftp://x.com/a', 'localhost', null, 5, 'https://' + 'a'.repeat(300) + '.com']) expect(cleanLink(bad)).toBeNull()
  })
})

describe('sanitizeProfileLinks', () => {
  it('keeps valid, unique links and caps at 10', () => {
    const many = Array.from({ length: 14 }, (_, i) => `https://site${i}.com`)
    expect(sanitizeProfileLinks(many)).toHaveLength(MAX_PROFILE_LINKS)
    expect(sanitizeProfileLinks(['https://a.com', 'https://a.com', 'bad', { url: 'https://b.com' }])).toEqual(['https://a.com/', 'https://b.com/'])
  })
  it('is safe on non-lists', () => {
    expect(sanitizeProfileLinks('x')).toEqual([])
    expect(sanitizeProfileLinks(null)).toEqual([])
  })
})

describe('collectProfileLinks / pickAllowedLinks', () => {
  const profile = {
    portfolioLinks: ['https://vimeo.com/1', 'https://example.com/work'],
    imdbLink: 'https://www.imdb.com/name/nm0000129/',
    showreelUrl: 'https://www.youtube.com/watch?v=abc',
    pastProjects: [{ title: 'Night Film', link: 'https://example.com/work' }, { title: 'Other', link: 'https://other.com/x' }],
  }
  it('lists showreel, IMDb, portfolio and project links without duplicates', () => {
    const links = collectProfileLinks(profile)
    expect(links.map((l) => l.kind)).toEqual(['showreel', 'imdb', 'portfolio', 'portfolio', 'project'])
    expect(links.find((l) => l.kind === 'project')?.url).toBe('https://other.com/x')
  })
  it('only lets crew attach links from their own profile', () => {
    expect(pickAllowedLinks(['https://vimeo.com/1', 'https://evil.com/x', 'https://vimeo.com/1'], profile)).toEqual(['https://vimeo.com/1'])
    expect(pickAllowedLinks('nope', profile)).toEqual([])
  })
})
