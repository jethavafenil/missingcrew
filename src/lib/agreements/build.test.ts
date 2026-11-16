import { describe, it, expect } from 'vitest'
import { agreementNumber, buildAgreement, parseAgreement, type AgreementInput } from './build'

const input: AgreementInput = {
  hireId: '9f3a1c2e-0000-4000-8000-000000000000',
  offeredAt: new Date('2026-11-10T09:00:00Z'),
  signedAt: new Date('2026-11-11T10:30:00Z'),
  role: '1st AD',
  message: 'Join us',
  project: {
    id: 'p1', projectCode: 'MC-000123', projectName: 'Night Shift', projectType: 'Short Film, Ad Film', location: 'Mumbai, Maharashtra, India',
    productionHouse: 'ABC Studios', shootStartDate: new Date('2026-12-01T00:00:00Z'), shootEndDate: new Date('2026-12-05T00:00:00Z'),
    shootDuration: '4-7_days', shootDurationCustom: null, productionStatus: 'FUNDING_SECURED', budgetMin: 10000, budgetMax: 15000, budgetFixed: false,
  },
  producerName: 'Asha', producerCompany: 'ABC Studios', crewName: 'Ravi Menon', crewMainRole: 'Editor',
}

describe('agreementNumber', () => {
  it('joins the project ID and four characters of the hire ID', () => {
    expect(agreementNumber('MC-000123', '9f3a1c2e-0000')).toBe('AGR-MC-000123-9F3A')
    expect(agreementNumber(null, '')).toBe('AGR-MC-0000')
  })
})

describe('buildAgreement', () => {
  it('freezes the project details, parties, dates and terms', () => {
    const a = buildAgreement(input)
    expect(a.number).toBe('AGR-MC-000123-9F3A')
    expect(a.offeredAt).toBe('2026-11-10T09:00:00.000Z')
    expect(a.signedAt).toBe('2026-11-11T10:30:00.000Z')
    expect(a.project).toMatchObject({ code: 'MC-000123', name: 'Night Shift', duration: '4–7 days', status: 'Funding secured', budget: '₹10,000 - ₹15,000 per day' })
    expect(a.producer).toEqual({ name: 'Asha', company: 'ABC Studios' })
    expect(a.crew.name).toBe('Ravi Menon')
    expect(a.role).toBe('1st AD')
    expect(a.terms.length).toBeGreaterThanOrEqual(5)
  })
  it('falls back to the crew main role and leaves unset details empty', () => {
    const a = buildAgreement({ ...input, role: '  ', project: { ...input.project, shootDuration: null, productionStatus: null, budgetMin: null, budgetMax: null } })
    expect(a.role).toBe('Editor')
    expect(a.project.duration).toBeNull()
    expect(a.project.status).toBeNull()
    expect(a.project.budget).toBeNull()
  })
  it('copies the terms so later edits to the template cannot change it', () => {
    const a = buildAgreement(input)
    a.terms[0].text = 'changed'
    expect(buildAgreement(input).terms[0].text).not.toBe('changed')
  })
})

describe('parseAgreement', () => {
  it('accepts what buildAgreement wrote and rejects anything else', () => {
    expect(parseAgreement(JSON.parse(JSON.stringify(buildAgreement(input))))?.number).toBe('AGR-MC-000123-9F3A')
    for (const bad of [null, 'x', {}, { number: 'A' }]) expect(parseAgreement(bad)).toBeNull()
  })
})
