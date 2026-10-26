import { describe, it, expect } from 'vitest'
import { roleKeyFor } from './roleVisuals'

describe('roleKeyFor', () => {
  it('uses the department list for exact role names', () => {
    expect(roleKeyFor('Camera Operator')).toBe('camera')
    expect(roleKeyFor('Key Grip')).toBe('lighting')
    expect(roleKeyFor('Director')).toBe('direction')
  })
  it('falls back to keywords for short names', () => {
    expect(roleKeyFor('Cinematographer')).toBe('camera')
    expect(roleKeyFor('Video Editor')).toBe('post')
    expect(roleKeyFor('Stunt Coordinator')).toBe('action')
    expect(roleKeyFor('Makeup Artist')).toBe('makeup')
    expect(roleKeyFor('Sound Recordist')).toBe('sound')
    expect(roleKeyFor('Gaffer')).toBe('lighting')
    expect(roleKeyFor('Costume Designer')).toBe('costume')
  })
  it('never fails on odd input', () => {
    expect(roleKeyFor('')).toBe('general')
    expect(roleKeyFor(null)).toBe('general')
    expect(roleKeyFor('Unicorn Wrangler')).toBe('general')
  })
})
