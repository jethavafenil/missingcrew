// Validation for the optional crew profile fields added in migration 0016.
// Each parser returns `{ ok: true, value }` (value may be null = cleared) or an error message.

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string }

export function parseGender(raw: unknown): Parsed<'MALE' | 'FEMALE' | 'OTHER' | null> {
  if (raw == null || raw === '') return { ok: true, value: null }
  const v = typeof raw === 'string' ? raw.trim().toUpperCase() : ''
  if (v === 'MALE' || v === 'FEMALE' || v === 'OTHER') return { ok: true, value: v }
  return { ok: false, error: 'Gender must be Male, Female or Other' }
}

// "2019-04" (month input) or a full date -> first day of that month, UTC.
export function parseFirstProject(raw: unknown, now: Date = new Date()): Parsed<Date | null> {
  if (raw == null || raw === '') return { ok: true, value: null }
  if (typeof raw !== 'string') return { ok: false, error: 'First project date is invalid' }
  const m = raw.trim().match(/^(\d{4})-(\d{2})(?:-\d{2})?(?:T.*)?$/)
  if (!m) return { ok: false, error: 'First project date must be a month and year' }
  const year = Number(m[1])
  const month = Number(m[2])
  if (month < 1 || month > 12 || year < 1950) return { ok: false, error: 'First project date is invalid' }
  const date = new Date(Date.UTC(year, month - 1, 1))
  if (date.getTime() > Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)) {
    return { ok: false, error: 'First project date cannot be in the future' }
  }
  return { ok: true, value: date }
}

export function parseShowreel(raw: unknown): Parsed<string | null> {
  if (raw == null || raw === '') return { ok: true, value: null }
  if (typeof raw !== 'string') return { ok: false, error: 'Showreel link is invalid' }
  const value = raw.trim()
  if (value.length > 300) return { ok: false, error: 'Showreel link is too long' }
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return { ok: false, error: 'Showreel must be a full link starting with https://' }
  }
  if (url.protocol !== 'https:') return { ok: false, error: 'Showreel must be a full link starting with https://' }
  return { ok: true, value: url.toString() }
}

export function youtubeId(url: string | null | undefined): string | null {
  if (!url) return null
  const m = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

export function vimeoId(url: string | null | undefined): string | null {
  if (!url) return null
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  return m ? m[1] : null
}
