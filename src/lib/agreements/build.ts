// Builds the agreement that is stored when a crew member accepts a hire request.
// Pure (no database), so the content and the numbering are unit-tested.
//
// The wording is the client's (clauses.ts); {{key}} markers in it are filled from `fields`, the
// values listed in the client's FIELD-MAPPING.md. Both the wording and the values are copied into
// the stored agreement, so it never changes afterwards.

import { formatProductionStatus, formatShootDuration } from '@/lib/projects/details'
import { formatBudget } from '@/lib/projects/format'
import { slugifyName } from '@/lib/utils'
import { cleanOffer, type OfferTerms } from '@/lib/hire/offer'
import { AGREEMENT_SECTIONS, type AgreementSection } from '@/lib/agreements/clauses'
import { AGREEMENT_TITLE, AGREEMENT_VERSION, NATURE_OF_ENGAGEMENT, NOT_PROVIDED, SITE, TO_BE_AGREED } from '@/lib/agreements/template'

export interface AgreementSnapshot {
  version: string
  title: string
  number: string
  offeredAt: string
  signedAt: string
  message: string
  fields: Record<string, string>
  sections: AgreementSection[]
}

export interface AgreementInput {
  hireId: string
  offeredAt: Date
  signedAt: Date
  role: string | null
  message: string
  // terms the producer filled in when hiring (all optional)
  offer?: OfferTerms | null
  project: {
    id: string
    projectCode: string | null
    projectName: string
    projectType: string
    location: string
    productionHouse: string | null
    description?: string | null
    shootStartDate: Date | null
    shootEndDate: Date | null
    shootDuration: string | null
    shootDurationCustom: string | null
    productionStatus: string | null
    budgetMin: number | null
    budgetMax: number | null
    budgetFixed: boolean | null
  }
  producerName: string
  producerCompany: string | null
  producerEmail?: string | null
  producerPhone?: string | null
  crewName: string
  crewMainRole: string | null
  crewEmail?: string | null
  crewPhone?: string | null
  crewAddress?: string | null
}

// "AGR-MC-000123-9F3A": project ID plus the first four characters of the hire request ID.
export function agreementNumber(projectCode: string | null | undefined, hireId: string): string {
  const tail = hireId.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase() || '0000'
  return `AGR-${projectCode || 'MC'}-${tail}`
}

const text = (v: string | null | undefined, fallback: string) => (v && v.trim() ? v.trim() : fallback)

// Phones are stored as 10 digits (older ones as +91...): shown as "+91 98765 43210".
export function displayPhone(phone: string | null | undefined): string {
  const digits = (phone || '').replace(/\D/g, '')
  const national = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits
  return national.length === 10 ? `+91 ${national.slice(0, 5)} ${national.slice(5)}` : text(phone, NOT_PROVIDED)
}

const day = (d: Date | null) => (d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : null)

export function buildFields(input: AgreementInput, number: string): Record<string, string> {
  const p = input.project
  const role = (input.role && input.role.trim()) || input.crewMainRole || 'Crew'
  const budget = formatBudget({ budgetMin: p.budgetMin, budgetMax: p.budgetMax, budgetFixed: p.budgetFixed })
  const duration = formatShootDuration(p.shootDuration, p.shootDurationCustom)
  const company = input.producerCompany && input.producerCompany !== input.producerName ? input.producerCompany : NOT_PROVIDED
  const signedAt = input.signedAt.toISOString()
  const offer = cleanOffer(input.offer) ?? {}
  const offerDay = (v: string | undefined) => (v ? day(new Date(v + 'T00:00:00Z')) : null)
  return {
    'agreement.id': number,
    'agreement.date': signedAt,
    'agreement.status': 'Confirmed',
    'site.name': SITE.name,
    'site.domain': SITE.domain,
    'site.governingLaw': SITE.governingLaw,
    'site.supportPhone': SITE.supportPhone,
    'site.supportEmail': SITE.supportEmail,
    'site.location': SITE.location,
    'employer.name': input.producerName,
    'employer.company': company,
    'employer.email': text(input.producerEmail, NOT_PROVIDED),
    'employer.phone': displayPhone(input.producerPhone),
    'employer.address': NOT_PROVIDED,
    'employer.username': slugifyName(input.producerName) || NOT_PROVIDED,
    'employer.signature': `Accepted electronically by ${input.producerName}`,
    'employer.signedAt': input.offeredAt.toISOString(),
    'crew.name': input.crewName,
    'crew.primaryRole': role,
    'crew.email': text(input.crewEmail, NOT_PROVIDED),
    'crew.phone': displayPhone(input.crewPhone),
    'crew.address': text(input.crewAddress, NOT_PROVIDED),
    'crew.username': slugifyName(input.crewName) || NOT_PROVIDED,
    'crew.signature': `Accepted electronically by ${input.crewName}`,
    'crew.signedAt': signedAt,
    'project.name': p.projectName,
    'project.type': p.projectType,
    'project.productionHouse': text(p.productionHouse, NOT_PROVIDED),
    'project.description': text(p.description, NOT_PROVIDED),
    'project.location': p.location,
    'project.status': text(formatProductionStatus(p.productionStatus), TO_BE_AGREED),
    'offer.position': role,
    // what the producer entered wins; otherwise the project's own details; otherwise "to be agreed"
    'offer.responsibilities': offer.responsibilities ?? TO_BE_AGREED,
    'offer.startDate': offerDay(offer.startDate) ?? day(p.shootStartDate) ?? TO_BE_AGREED,
    'offer.endDate': offerDay(offer.endDate) ?? day(p.shootEndDate) ?? (duration ? `Shoot duration: ${duration}` : TO_BE_AGREED),
    'offer.schedule': offer.schedule ?? TO_BE_AGREED,
    'offer.engagementType': offer.engagementType ?? TO_BE_AGREED,
    'offer.workArrangement': offer.workArrangement ?? TO_BE_AGREED,
    'offer.totalFee': offer.totalFee ?? (budget ? `${budget} (budget shown on the project; the final fee is as agreed between the parties)` : TO_BE_AGREED),
    'offer.paymentBasis': offer.paymentBasis ?? TO_BE_AGREED,
    'offer.advancePayment': offer.advancePayment ?? TO_BE_AGREED,
    'offer.remainingPayment': offer.remainingPayment ?? TO_BE_AGREED,
    'offer.paymentSchedule': offer.paymentSchedule ?? TO_BE_AGREED,
    'offer.paymentMethod': offer.paymentMethod ?? TO_BE_AGREED,
    'offer.ownershipTerms': offer.ownershipTerms ?? TO_BE_AGREED,
    'offer.screenCredit': offer.screenCredit ?? TO_BE_AGREED,
    'offer.creditName': offer.creditName ?? input.crewName,
    'offer.natureOfEngagement': NATURE_OF_ENGAGEMENT,
  }
}

export function buildAgreement(input: AgreementInput): AgreementSnapshot {
  const number = agreementNumber(input.project.projectCode, input.hireId)
  return {
    version: AGREEMENT_VERSION,
    title: AGREEMENT_TITLE,
    number,
    offeredAt: input.offeredAt.toISOString(),
    signedAt: input.signedAt.toISOString(),
    message: input.message,
    fields: buildFields(input, number),
    // deep copy: later edits to the wording cannot change this agreement
    sections: JSON.parse(JSON.stringify(AGREEMENT_SECTIONS)) as AgreementSection[],
  }
}

// Fills the {{key}} markers of a clause. Unknown keys show the bracketed key so a gap is visible.
export function fillFields(textWithMarkers: string, fields: Record<string, string>): string {
  return textWithMarkers.replace(/\{\{([\w.]+)\}\}/g, (_m, key: string) => fields[key] ?? `[${key}]`)
}

// Stored JSON -> snapshot (or null when it is missing or not a current agreement).
export function parseAgreement(value: unknown): AgreementSnapshot | null {
  if (!value || typeof value !== 'object') return null
  const v = value as Partial<AgreementSnapshot>
  if (typeof v.number !== 'string' || typeof v.signedAt !== 'string' || typeof v.offeredAt !== 'string') return null
  if (!v.fields || typeof v.fields !== 'object' || !Array.isArray(v.sections)) return null
  return v as AgreementSnapshot
}
