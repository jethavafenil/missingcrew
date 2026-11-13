// City suggestions come from LocationIQ through our own /api/locations route, so the access
// key stays on the server and results can be cached (the free plan is limited per day).

export interface LocationSuggestion {
  place_id: string
  display_name: string
  lat: string
  lon: string
}

// "Delhi, Delhi, Delhi, India" -> "Delhi, India"
export function cleanDisplayName(displayName: string): string {
  const seen = new Set<string>()
  const parts: string[] = []
  for (const raw of displayName.split(',')) {
    const part = raw.trim()
    const key = part.toLowerCase()
    if (part && !seen.has(key)) {
      seen.add(key)
      parts.push(part)
    }
  }
  return parts.join(', ')
}

// Search text we accept: at least 2 letters, short, no control characters.
export function normalizeLocationQuery(raw: string | null | undefined): string | null {
  const q = (raw || '').replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim()
  if (q.length < 2 || q.length > 80) return null
  return q
}

// Keep only what the dropdown needs, drop duplicates by cleaned name.
export function simplifySuggestions(data: unknown, limit = 6): LocationSuggestion[] {
  if (!Array.isArray(data)) return []
  const out: LocationSuggestion[] = []
  const seen = new Set<string>()
  for (const item of data) {
    if (!item || typeof item !== 'object') continue
    const r = item as Record<string, unknown>
    if (typeof r.display_name !== 'string') continue
    const name = cleanDisplayName(r.display_name)
    const key = name.toLowerCase()
    if (!name || seen.has(key)) continue
    seen.add(key)
    out.push({ place_id: String(r.place_id ?? key), display_name: name, lat: String(r.lat ?? ''), lon: String(r.lon ?? '') })
    if (out.length >= limit) break
  }
  return out
}
