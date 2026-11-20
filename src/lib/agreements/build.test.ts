import { describe, it, expect } from 'vitest'
import { agreementNumber, buildAgreement, fillFields, parseAgreement, type AgreementInput } from './build'

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
  it('freezes the parties, project, dates and wording', () => {
    const a = buildAgreement({ ...input, producerEmail: 'asha@x.com', producerPhone: '9876543210', crewEmail: 'ravi@x.com', crewPhone: '+919123456789', crewAddress: 'Pune' })
    expect(a.number).toBe('AGR-MC-000123-9F3A')
    expect(a.version).toBe('2.0')
    expect(a.offeredAt).toBe('2026-11-10T09:00:00.000Z')
    expect(a.signedAt).toBe('2026-11-11T10:30:00.000Z')
    expect(a.fields).toMatchObject({
      'agreement.id': 'AGR-MC-000123-9F3A',
      'employer.name': 'Asha',
      'employer.company': 'ABC Studios',
      'employer.email': 'asha@x.com',
      'employer.phone': '+91 98765 43210',
      'crew.name': 'Ravi Menon',
      'crew.phone': '+91 91234 56789',
      'crew.address': 'Pune',
      'crew.primaryRole': '1st AD',
      'project.name': 'Night Shift',
      'project.status': 'Funding secured',
      'offer.startDate': '1 December 2026',
      'offer.endDate': '5 December 2026',
      'site.governingLaw': 'Govt of India',
    })
    expect(a.fields['offer.totalFee']).toContain('₹10,000 - ₹15,000 per day')
    expect(a.sections.length).toBe(18)
  })
  it('falls back to the crew main role and says so where a detail is not held', () => {
    const a = buildAgreement({ ...input, role: '  ', project: { ...input.project, productionStatus: null, shootEndDate: null, budgetMin: null, budgetMax: null } })
    expect(a.fields['crew.primaryRole']).toBe('Editor')
    expect(a.fields['employer.phone']).toBe('Not provided')
    expect(a.fields['project.status']).toBe('To be agreed in writing between the parties')
    expect(a.fields['offer.endDate']).toBe('Shoot duration: 4–7 days')
    expect(a.fields['offer.totalFee']).toBe('To be agreed in writing between the parties')
  })
  it('does not repeat the company when it is the producer name', () => {
    expect(buildAgreement({ ...input, producerCompany: 'Asha' }).fields['employer.company']).toBe('Not provided')
  })
  it('copies the wording so later edits to the template cannot change it', () => {
    const a = buildAgreement(input)
    const first = a.sections[0].title
    a.sections[0].title = 'changed'
    expect(buildAgreement(input).sections[0].title).toBe(first)
  })
  it('every marker in the wording has a value', () => {
    const a = buildAgreement(input)
    const keys: string[] = []
    for (const s of a.sections) for (const b of s.blocks) {
      const texts = b.k === 'ul' ? b.items : b.k === 'kv' ? b.items.map((i) => `{{${i.field}}}`) : [b.x]
      for (const t of texts) (t.match(/\{\{([\w.]+)\}\}/g) ?? []).forEach((m) => keys.push(m.slice(2, -2)))
    }
    expect(keys.filter((k) => !(k in a.fields))).toEqual([])
  })
})

describe('offer terms in the agreement', () => {
  it('uses what the producer entered and falls back for the rest', () => {
    const a = buildAgreement({
      ...input,
      offer: { responsibilities: 'Direct units A and B', startDate: '2026-12-02', totalFee: '₹60,000', paymentBasis: 'Per Day', paymentMethod: 'UPI', creditName: 'R. Menon' },
    })
    expect(a.fields).toMatchObject({
      'offer.responsibilities': 'Direct units A and B',
      'offer.startDate': '2 December 2026',
      'offer.endDate': '5 December 2026', // from the project
      'offer.totalFee': '₹60,000',
      'offer.paymentBasis': 'Per Day',
      'offer.paymentMethod': 'UPI',
      'offer.creditName': 'R. Menon',
      'offer.schedule': 'To be agreed in writing between the parties',
    })
  })
  it('ignores an invalid offer instead of printing it', () => {
    const a = buildAgreement({ ...input, offer: { engagementType: 'Forever', evil: '<b>x</b>' } as never })
    expect(a.fields['offer.engagementType']).toBe('To be agreed in writing between the parties')
    expect(JSON.stringify(a.fields)).not.toContain('<b>x</b>')
  })
})

describe('fillFields', () => {
  it('replaces markers and shows the key when a value is missing', () => {
    expect(fillFields('{{a}} and {{b}}', { a: 'X' })).toBe('X and [b]')
  })
})

describe('parseAgreement', () => {
  it('accepts what buildAgreement wrote and rejects anything else', () => {
    expect(parseAgreement(JSON.parse(JSON.stringify(buildAgreement(input))))?.number).toBe('AGR-MC-000123-9F3A')
    for (const bad of [null, 'x', {}, { number: 'A' }, { number: 'A', signedAt: 'x', offeredAt: 'y', terms: [] }]) expect(parseAgreement(bad)).toBeNull()
  })
})
