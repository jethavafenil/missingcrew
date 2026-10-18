import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugifyName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// Post-login redirect targets must be same-origin paths. Rejects protocol-
// relative URLs ("//evil.com") and backslash variants ("/\evil.com") that
// browsers normalise to "//", plus control characters.
export function isSafeReturnPath(value: string | null | undefined): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !/[\\\u0000-\u001f]/.test(value)
  )
}

// Person-name sanity check: must contain at least one letter in any script
// (rejects e.g. a phone number typed into a name field). RegExp constructor
// because the tsconfig target predates the /u regex-literal flag.
const LETTER_RE = new RegExp(String.raw`\p{L}`, 'u')
export function containsLetter(value: string): boolean {
  return LETTER_RE.test(value)
}

// True when a date-only value ("YYYY-MM-DD" / a Date at UTC midnight) is
// before today. One day of tolerance covers timezone differences between the
// browser's local "today" and the server's UTC day.
export function isBeforeToday(value: Date | string, toleranceDays = 1): boolean {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return true
  const now = new Date()
  const startOfTodayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return date.getTime() < startOfTodayUtc - toleranceDays * 86_400_000
}

// Local-date "YYYY-MM-DD" for <input type="date" min=...>.
export function todayInputValue(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// unstable_cache serializes cached values to JSON, so Date fields come back as
// strings on a cache hit and Date objects on a miss. Accept either.
export function toIsoString(value: Date | string | null | undefined): string | null {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}
