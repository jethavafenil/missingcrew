// Shoot duration and project status: the fixed choices a producer picks while posting a project,
// plus the text shown on cards and detail pages.

export const SHOOT_DURATIONS = [
  { value: '1-3_days', label: '1–3 days' },
  { value: '4-7_days', label: '4–7 days' },
  { value: '1-2_weeks', label: '1–2 weeks' },
  { value: '3-4_weeks', label: '3–4 weeks' },
  { value: 'custom', label: 'Custom' },
] as const

export type ShootDuration = (typeof SHOOT_DURATIONS)[number]['value']
export const SHOOT_DURATION_VALUES = SHOOT_DURATIONS.map((d) => d.value) as [ShootDuration, ...ShootDuration[]]

export const PRODUCTION_STATUSES = [
  { value: 'CONFIRMED', label: 'Confirmed', hint: 'The project is going ahead' },
  { value: 'FUNDING_SECURED', label: 'Funding secured', hint: 'Budget is in place' },
  { value: 'IN_DEVELOPMENT', label: 'In development', hint: 'Still being planned' },
  { value: 'AWAITING_APPROVAL', label: 'Awaiting approval', hint: 'Waiting for a go-ahead' },
] as const

export type ProductionStatus = (typeof PRODUCTION_STATUSES)[number]['value']
export const PRODUCTION_STATUS_VALUES = PRODUCTION_STATUSES.map((s) => s.value) as [ProductionStatus, ...ProductionStatus[]]

// "Custom" duration: a number and a unit, saved as "10 days" (the database checks the same pattern).
export const CUSTOM_DURATION_UNITS = ['days', 'weeks', 'months'] as const
export type CustomDurationUnit = (typeof CUSTOM_DURATION_UNITS)[number]

const UNIT_MAX: Record<CustomDurationUnit, number> = { days: 365, weeks: 52, months: 24 }

export interface CustomDuration {
  value: number
  unit: CustomDurationUnit
}

export function parseCustomDuration(raw: unknown): CustomDuration | null {
  if (typeof raw !== 'string') return null
  const m = raw.trim().match(/^(\d{1,3}) (days|weeks|months)$/)
  if (!m) return null
  const value = Number(m[1])
  const unit = m[2] as CustomDurationUnit
  if (value < 1 || value > UNIT_MAX[unit]) return null
  return { value, unit }
}

export function buildCustomDuration(value: number | string, unit: string): string | null {
  const n = typeof value === 'number' ? value : Number(String(value).trim())
  if (!Number.isInteger(n)) return null
  return parseCustomDuration(`${n} ${unit}`) ? `${n} ${unit}` : null
}

export function customDurationError(): string {
  return 'Enter a custom duration as a whole number, e.g. 10 days (up to 365 days, 52 weeks or 24 months)'
}

// "1–3 days" | "10 days" | "1 week" | null
export function formatShootDuration(duration: string | null | undefined, custom: string | null | undefined): string | null {
  if (!duration) return null
  if (duration === 'custom') {
    const c = parseCustomDuration(custom)
    if (!c) return 'Custom duration'
    const unit = c.value === 1 ? c.unit.replace(/s$/, '') : c.unit
    return `${c.value} ${unit}`
  }
  return SHOOT_DURATIONS.find((d) => d.value === duration)?.label ?? null
}

export function formatProductionStatus(status: string | null | undefined): string | null {
  return PRODUCTION_STATUSES.find((s) => s.value === status)?.label ?? null
}

// Badge colour per status (Tailwind classes), kept here so every page shows the same look.
export const PRODUCTION_STATUS_STYLE: Record<ProductionStatus, string> = {
  CONFIRMED: 'bg-green-100 text-green-800 border-green-200',
  FUNDING_SECURED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  IN_DEVELOPMENT: 'bg-blue-100 text-blue-800 border-blue-200',
  AWAITING_APPROVAL: 'bg-amber-100 text-amber-800 border-amber-200',
}
