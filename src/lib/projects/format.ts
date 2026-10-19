// Display helpers for the optional shoot dates and the per-day budget of a project.

type DateLike = string | Date | null | undefined

function parse(value: DateLike): Date | null {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

const SHORT: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }

// "Oct 5, 2026 - Oct 20, 2026" | "Starts Oct 5, 2026" | "Until Oct 20, 2026" | "Dates flexible"
export function formatShootRange(start: DateLike, end: DateLike): string {
  const s = parse(start)
  const e = parse(end)
  if (s && e) return `${s.toLocaleDateString('en-US', SHORT)} - ${e.toLocaleDateString('en-US', SHORT)}`
  if (s) return `Starts ${s.toLocaleDateString('en-US', SHORT)}`
  if (e) return `Until ${e.toLocaleDateString('en-US', SHORT)}`
  return 'Dates flexible'
}

// Single date for detail views; `fallback` when the producer hasn't set one.
export function formatShootDate(value: DateLike, fallback = 'To be announced'): string {
  const d = parse(value)
  return d ? d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : fallback
}

// Epoch ms or null, for filtering/sorting projects that may have no dates.
export function shootTimestamp(value: DateLike): number | null {
  const d = parse(value)
  return d ? d.getTime() : null
}

export interface BudgetFields {
  budgetMin?: number | null
  budgetMax?: number | null
  budgetFixed?: boolean | null
}

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`

// "₹15,000 per day (fixed)" | "₹10,000 - ₹20,000 per day" | "From ₹10,000 per day" | null
export function formatBudget({ budgetMin, budgetMax, budgetFixed }: BudgetFields): string | null {
  const min = budgetMin ?? null
  const max = budgetMax ?? null
  if (budgetFixed && (min ?? max) != null) return `${inr((min ?? max) as number)} per day (fixed)`
  if (min != null && max != null) return min === max ? `${inr(min)} per day` : `${inr(min)} - ${inr(max)} per day`
  if (min != null) return `From ${inr(min)} per day`
  if (max != null) return `Up to ${inr(max)} per day`
  return null
}
