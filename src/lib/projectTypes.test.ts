import { describe, it, expect } from 'vitest'
import { PROJECT_TYPES, canonicalProjectType, joinProjectTypes, splitProjectTypes, MAX_PROJECT_TYPES } from './projectTypes'
import { projectInputSchema } from './projects/schema'

describe('project type list', () => {
  it('has the client list, without duplicates', () => {
    expect(PROJECT_TYPES.length).toBe(50)
    expect(new Set(PROJECT_TYPES).size).toBe(PROJECT_TYPES.length)
    for (const t of ['Feature Film', 'Ad Film', 'Instagram Reel', 'Podcast (Video)', 'Wedding Film', 'Other', 'TV Commercial (TVC)']) expect(PROJECT_TYPES).toContain(t)
  })
  it('maps older names to the new ones', () => {
    expect(canonicalProjectType('Ads')).toBe('Ad Film')
    expect(canonicalProjectType(' feature films ')).toBe('Feature Film')
    expect(canonicalProjectType('Documentary')).toBe('Documentary Film')
    expect(canonicalProjectType('Corporate Video')).toBe('Corporate Film')
    expect(canonicalProjectType('Web Series')).toBe('Web Series')
  })
  it('splits and joins several types', () => {
    expect(splitProjectTypes('Ads, Music Video')).toEqual(['Ad Film', 'Music Video'])
    expect(joinProjectTypes(['A', ' A ', 'B'])).toBe('A, B')
    expect(splitProjectTypes('')).toEqual([])
  })
})

describe('project schema types', () => {
  const base = { projectName: 'X', rolesNeeded: ['Director'], location: 'Mumbai', description: 'd', questions: [], contactPreference: ['email'] }
  it('accepts several listed types and stores them joined', () => {
    const r = projectInputSchema.safeParse({ ...base, projectType: 'Ad Film, Brand Film' })
    expect(r.success && r.data.projectType).toBe('Ad Film, Brand Film')
  })
  it('maps a legacy name', () => {
    const r = projectInputSchema.safeParse({ ...base, projectType: 'Ads' })
    expect(r.success && r.data.projectType).toBe('Ad Film')
  })
  it('rejects unknown types and too many', () => {
    expect(projectInputSchema.safeParse({ ...base, projectType: 'Made Up Type' }).success).toBe(false)
    const many = PROJECT_TYPES.slice(0, MAX_PROJECT_TYPES + 1).join(', ')
    expect(projectInputSchema.safeParse({ ...base, projectType: many }).success).toBe(false)
    expect(projectInputSchema.safeParse({ ...base, projectType: '  ' }).success).toBe(false)
  })
})
