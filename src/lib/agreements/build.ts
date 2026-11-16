// Builds the agreement that is stored when a crew member accepts a hire request.
// Pure (no database), so the content and the numbering are unit-tested.

import { formatProductionStatus, formatShootDuration } from '@/lib/projects/details'
import { formatBudget } from '@/lib/projects/format'
import { AGREEMENT_TERMS, AGREEMENT_TITLE, AGREEMENT_VERSION } from '@/lib/agreements/template'

export interface AgreementSnapshot {
  version: string
  title: string
  number: string
  offeredAt: string
  signedAt: string
  project: {
    id: string
    code: string
    name: string
    type: string
    location: string
    productionHouse: string | null
    startDate: string | null
    endDate: string | null
    duration: string | null
    status: string | null
    budget: string | null
  }
  producer: { name: string; company: string | null }
  crew: { name: string }
  role: string
  message: string
  terms: Array<{ heading: string; text: string }>
}

export interface AgreementInput {
  hireId: string
  offeredAt: Date
  signedAt: Date
  role: string | null
  message: string
  project: {
    id: string
    projectCode: string | null
    projectName: string
    projectType: string
    location: string
    productionHouse: string | null
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
  crewName: string
  crewMainRole: string | null
}

// "AGR-MC-000123-9F3A": project ID plus the first four characters of the hire request ID.
export function agreementNumber(projectCode: string | null | undefined, hireId: string): string {
  const tail = hireId.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase() || '0000'
  return `AGR-${projectCode || 'MC'}-${tail}`
}

export function buildAgreement(input: AgreementInput): AgreementSnapshot {
  const p = input.project
  return {
    version: AGREEMENT_VERSION,
    title: AGREEMENT_TITLE,
    number: agreementNumber(p.projectCode, input.hireId),
    offeredAt: input.offeredAt.toISOString(),
    signedAt: input.signedAt.toISOString(),
    project: {
      id: p.id,
      code: p.projectCode ?? '',
      name: p.projectName,
      type: p.projectType,
      location: p.location,
      productionHouse: p.productionHouse,
      startDate: p.shootStartDate ? p.shootStartDate.toISOString() : null,
      endDate: p.shootEndDate ? p.shootEndDate.toISOString() : null,
      duration: formatShootDuration(p.shootDuration, p.shootDurationCustom),
      status: formatProductionStatus(p.productionStatus),
      budget: formatBudget({ budgetMin: p.budgetMin, budgetMax: p.budgetMax, budgetFixed: p.budgetFixed }),
    },
    producer: { name: input.producerName, company: input.producerCompany },
    crew: { name: input.crewName },
    role: (input.role && input.role.trim()) || input.crewMainRole || 'Crew',
    message: input.message,
    terms: AGREEMENT_TERMS.map((t) => ({ ...t })),
  }
}

// Stored JSON -> snapshot (or null when it is missing or not an agreement we wrote).
export function parseAgreement(value: unknown): AgreementSnapshot | null {
  if (!value || typeof value !== 'object') return null
  const v = value as Partial<AgreementSnapshot>
  if (typeof v.number !== 'string' || typeof v.signedAt !== 'string' || !v.project || !v.producer || !v.crew || !Array.isArray(v.terms)) return null
  return v as AgreementSnapshot
}
