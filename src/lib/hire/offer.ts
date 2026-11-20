// The offer terms a producer can put on a hire request. They are optional: whatever is left empty
// is written into the agreement as "to be agreed". One list drives the form, the checks on the
// server, the summary the crew member sees, and the agreement.

import { z } from 'zod'

export type OfferKey =
  | 'responsibilities'
  | 'startDate'
  | 'endDate'
  | 'schedule'
  | 'engagementType'
  | 'workArrangement'
  | 'totalFee'
  | 'paymentBasis'
  | 'advancePayment'
  | 'remainingPayment'
  | 'paymentSchedule'
  | 'paymentMethod'
  | 'ownershipTerms'
  | 'screenCredit'
  | 'creditName'

export interface OfferField {
  key: OfferKey
  label: string
  kind: 'text' | 'textarea' | 'date' | 'select'
  max: number
  options?: readonly string[]
  placeholder?: string
  group: 'Engagement' | 'Payment' | 'Rights and credit'
}

export const OFFER_FIELDS: readonly OfferField[] = [
  { key: 'responsibilities', label: 'Responsibilities', kind: 'textarea', max: 1000, group: 'Engagement', placeholder: 'What the crew member will be doing' },
  { key: 'startDate', label: 'Start date', kind: 'date', max: 10, group: 'Engagement' },
  { key: 'endDate', label: 'End date', kind: 'date', max: 10, group: 'Engagement' },
  { key: 'schedule', label: 'Reporting time / working schedule', kind: 'text', max: 300, group: 'Engagement', placeholder: 'e.g. 7:00 am call, 10-hour days' },
  { key: 'engagementType', label: 'Engagement type', kind: 'select', max: 40, group: 'Engagement', options: ['Full-time', 'Part-time', 'Daily', 'Project-based', 'Other'] },
  { key: 'workArrangement', label: 'Work arrangement', kind: 'select', max: 40, group: 'Engagement', options: ['On-site', 'Remote', 'Hybrid'] },
  { key: 'totalFee', label: 'Total agreed fee', kind: 'text', max: 100, group: 'Payment', placeholder: 'e.g. ₹60,000' },
  { key: 'paymentBasis', label: 'Payment basis', kind: 'select', max: 40, group: 'Payment', options: ['Per Day', 'Per Week', 'Per Project', 'Other'] },
  { key: 'advancePayment', label: 'Advance payment', kind: 'text', max: 100, group: 'Payment', placeholder: 'e.g. 30% or ₹15,000' },
  { key: 'remainingPayment', label: 'Remaining payment', kind: 'text', max: 100, group: 'Payment', placeholder: 'e.g. ₹45,000' },
  { key: 'paymentSchedule', label: 'Payment schedule', kind: 'textarea', max: 500, group: 'Payment', placeholder: 'Dates or milestones' },
  { key: 'paymentMethod', label: 'Payment method', kind: 'select', max: 40, group: 'Payment', options: ['Bank Transfer', 'UPI', 'Other'] },
  { key: 'ownershipTerms', label: 'Ownership / licence terms', kind: 'textarea', max: 1000, group: 'Rights and credit', placeholder: 'Who owns the work and how it may be used' },
  { key: 'screenCredit', label: 'Screen credit', kind: 'text', max: 200, group: 'Rights and credit', placeholder: 'e.g. Assistant Director, end titles' },
  { key: 'creditName', label: 'Name to appear in credits', kind: 'text', max: 100, group: 'Rights and credit' },
]

export const OFFER_GROUPS = ['Engagement', 'Payment', 'Rights and credit'] as const

export type OfferTerms = Partial<Record<OfferKey, string>>

const DATE = /^\d{4}-\d{2}-\d{2}$/
// control characters (other than new lines in the long fields) are never wanted in a legal text
const CONTROL = new RegExp(String.raw`[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]`, 'g')

function clean(field: OfferField, raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  let v = raw.replace(CONTROL, '').trim()
  if (field.kind !== 'textarea') v = v.replace(/\s+/g, ' ')
  if (!v) return null
  if (field.kind === 'date') {
    if (!DATE.test(v) || Number.isNaN(Date.parse(v))) return null
    return v
  }
  if (field.kind === 'select') return field.options?.includes(v) ? v : null
  return v.slice(0, field.max)
}

// Keeps only known fields with real values; anything else is dropped. Returns null when nothing is left.
export function cleanOffer(input: unknown): OfferTerms | null {
  if (!input || typeof input !== 'object') return null
  const src = input as Record<string, unknown>
  const out: OfferTerms = {}
  for (const f of OFFER_FIELDS) {
    const v = clean(f, src[f.key])
    if (v) out[f.key] = v
  }
  return Object.keys(out).length > 0 ? out : null
}

// A bad value (unknown option, end before start) is a clear error for the producer, not a silent drop.
export function offerError(input: unknown): string | null {
  if (!input || typeof input !== 'object') return null
  const src = input as Record<string, unknown>
  for (const f of OFFER_FIELDS) {
    const raw = src[f.key]
    if (typeof raw === 'string' && raw.trim() && clean(f, raw) === null) return `${f.label} is not valid`
  }
  const o = cleanOffer(input)
  if (o?.startDate && o.endDate && o.endDate < o.startDate) return 'The end date cannot be before the start date'
  return null
}

// zod side: accepts an object of strings, checks it, and stores the cleaned version.
export const offerSchema = z
  .record(z.string(), z.unknown())
  .superRefine((v, ctx) => {
    const err = offerError(v)
    if (err) ctx.addIssue({ code: 'custom', message: err })
  })
  .transform((v) => cleanOffer(v))

// Rows for display (crew summary, confirmation step): label + value for every filled field.
export function offerRows(offer: unknown): Array<{ key: OfferKey; label: string; value: string; group: OfferField['group'] }> {
  const o = cleanOffer(offer)
  if (!o) return []
  return OFFER_FIELDS.filter((f) => o[f.key]).map((f) => ({
    key: f.key,
    label: f.label,
    group: f.group,
    value: f.kind === 'date' ? new Date(o[f.key] as string).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : (o[f.key] as string),
  }))
}
