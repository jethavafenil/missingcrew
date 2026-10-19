import { describe, expect, it } from 'vitest'
import { buildHireMessage, buildProfileShareMessage } from '@/lib/shareMessages'

describe('premade messages', () => {
  it('profile share message uses available details only', () => {
    expect(buildProfileShareMessage({ name: 'Asha', role: 'Cinematographer', city: 'Mumbai' }))
      .toBe('Check out Asha, Cinematographer from Mumbai on MissingCrew. Available for work. View the full profile:')
    expect(buildProfileShareMessage({ name: 'Asha' })).toBe('Check out Asha on MissingCrew. Available for work. View the full profile:')
  })
  it('hire message fills in the producer, project and role', () => {
    const m = buildHireMessage({ crewName: 'Asha', producerName: 'Ravi', productionHouse: 'ABC Studios', projectName: 'Neon Nights', city: 'Goa', dates: '12-25 Nov', role: 'Gaffer' })
    expect(m).toContain('Hi Asha')
    expect(m).toContain('Ravi from ABC Studios')
    expect(m).toContain('Neon Nights in Goa (12-25 Nov)')
    expect(m).toContain('as Gaffer')
    expect(buildHireMessage({ crewName: 'A', producerName: 'B' })).toContain("I'm B.")
  })
})
