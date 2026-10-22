import { describe, it, expect } from 'vitest'
import { stripGuestProfile } from './guestView'

describe('stripGuestProfile', () => {
  it('removes links, imdb and referrer but keeps project titles and types', () => {
    const out = stripGuestProfile({
      imdbLink: 'https://www.imdb.com/name/nm1234567/',
      portfolioLinks: ['https://vimeo.com/1'],
      referredBy: 'a@b.com',
      pastProjects: [{ title: 'T', type: 'Ads', link: 'https://x.com' }],
    })
    expect(out.imdbLink).toBeNull()
    expect(out.portfolioLinks).toEqual([])
    expect(out.referredBy).toBeNull()
    expect(out.pastProjects).toEqual([{ title: 'T', type: 'Ads', link: null }])
    expect(out.linksHidden).toBe(true)
  })
  it('handles missing past projects', () => {
    expect((stripGuestProfile({}) as { pastProjects?: unknown }).pastProjects).toBeUndefined()
  })
})
