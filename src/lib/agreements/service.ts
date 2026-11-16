import 'server-only'
import { hireRequestRepo, type HireRequestWithRelations } from '@/lib/repo'
import { buildAgreement, parseAgreement, type AgreementSnapshot } from '@/lib/agreements/build'

// The agreement of an accepted hire request. It is written when the crew member accepts; an
// accepted request from before agreements existed gets its agreement the first time it is
// opened (dated with the day it was accepted), so every accepted hire has one.
export async function ensureAgreement(hire: HireRequestWithRelations): Promise<AgreementSnapshot | null> {
  const existing = parseAgreement(hire.agreement)
  if (existing) return existing
  if (hire.status !== 'ACCEPTED' || !hire.project || !hire.employer || !hire.crew) return null

  const snapshot = buildAgreement({
    hireId: hire.id,
    offeredAt: hire.createdAt,
    signedAt: hire.respondedAt ?? new Date(),
    role: hire.role,
    message: hire.message,
    project: hire.project,
    producerName: hire.employer.user?.name || hire.employer.companyName || 'Producer',
    producerCompany: hire.employer.companyName || null,
    crewName: hire.crew.user?.name || 'Crew member',
    crewMainRole: hire.crew.primaryRoles?.[0] ?? null,
  })

  const saved = await hireRequestRepo.saveAgreement(hire.id, snapshot)
  if (saved) return snapshot
  // another request wrote it first: use that one so everyone sees the same text
  const fresh = await hireRequestRepo.findById(hire.id)
  return parseAgreement(fresh?.agreement) ?? snapshot
}
