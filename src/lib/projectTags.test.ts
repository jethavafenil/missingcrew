import { describe, expect, it } from 'vitest'
import { displayHashtags, normalizeTag, normalizeTags, typeTag } from '@/lib/projectTags'
import { projectInputSchema } from '@/lib/projects/schema'

describe('normalizeTag(s)', () => {
  it('cleans free text into a hashtag word', () => {
    expect(normalizeTag('#night shoot!')).toBe('NightShoot')
    expect(normalizeTag('  thriller ')).toBe('Thriller')
    expect(normalizeTag('<script>')).toBe('Script')
    expect(normalizeTag('###')).toBe('')
    expect(normalizeTag('a'.repeat(80)).length).toBe(30)
  })
  it('keeps non-English letters', () => {
    expect(normalizeTag('मुंबई')).not.toBe('')
  })
  it('drops empties and case-insensitive duplicates, keeping order', () => {
    expect(normalizeTags(['Thriller', 'thriller', '', '#Comedy', 'THRILLER'])).toEqual(['Thriller', 'Comedy'])
  })
})

describe('displayHashtags', () => {
  it('derives the type tag first, then custom tags, without duplicates', () => {
    expect(typeTag('Feature Films')).toBe('FeatureFilms')
    expect(displayHashtags('Feature Films', ['Thriller', 'featurefilms'])).toEqual(['#FeatureFilms', '#Thriller'])
    expect(displayHashtags('Ads, Music Video', [])).toEqual(['#Ads', '#MusicVideo'])
    expect(displayHashtags('', undefined)).toEqual(['#FilmProject'])
  })
})

describe('project schema tags', () => {
  const base = {
    projectName: 'X', projectType: 'Ads', rolesNeeded: ['Director'], location: 'Mumbai',
    description: 'd', questions: [], contactPreference: ['email'],
  }
  it('accepts up to 3 tags (normalised) and rejects more', () => {
    const ok = projectInputSchema.safeParse({ ...base, tags: ['#night shoot', 'Comedy', 'comedy'] })
    expect(ok.success && ok.data.tags).toEqual(['NightShoot', 'Comedy'])
    expect(projectInputSchema.safeParse({ ...base, tags: ['A1', 'B2', 'C3', 'D4'] }).success).toBe(false)
    const none = projectInputSchema.safeParse(base)
    expect(none.success && none.data.tags).toEqual([])
  })
})
