// Custom project hashtags: producers may add up to MAX_PROJECT_TAGS free-text tags
// on top of the hashtag derived from the project type. Suggestions are only hints.

export const MAX_PROJECT_TAGS = 3
export const MAX_TAG_LENGTH = 30

// RegExp constructor: the tsconfig target predates the /u regex-literal flag.
const NON_ALNUM = new RegExp(String.raw`[^\p{L}\p{N}]`, 'gu')

// The only hashtags anyone can use (projects and crew). Edit this list when the client sends
// the final one: each label becomes a CamelCase tag ("Night Shoot" -> #NightShoot).
export const TAG_GROUPS: ReadonlyArray<{ group: string; labels: readonly string[] }> = [
  {
    group: 'Genre',
    labels: ['Thriller', 'Comedy', 'Drama', 'Romance', 'Action', 'Horror', 'Fantasy', 'Sci-Fi', 'Crime', 'Mystery', 'Family', 'Biopic', 'Historical', 'Musical', 'Animation', 'Mythology', 'Social Issue'],
  },
  {
    group: 'Style & industry',
    labels: ['Bollywood', 'Regional', 'Independent', 'Student Film', 'Festival', 'OTT', 'Television', 'Devotional'],
  },
  {
    group: 'Content',
    labels: ['Fashion', 'Travel', 'Food', 'Wedding', 'Corporate', 'Sports', 'Real Estate', 'Education', 'Social Media'],
  },
  {
    group: 'Shoot',
    labels: ['Night Shoot', 'Outdoor', 'Studio', 'Travel Shoot', 'Low Budget', 'Paid', 'Urgent'],
  },
]

export const PREMADE_TAGS: string[] = TAG_GROUPS.flatMap((g) => [...g.labels])

// "#night shoot!" -> "NightShoot". Letters/digits only (any language), CamelCase words.
export function normalizeTag(raw: string): string {
  return raw
    .replace(/^#+/, '')
    .split(/\s+/)
    .map((word) => word.replace(NON_ALNUM, ''))
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
    .slice(0, MAX_TAG_LENGTH)
}

// Tag value for a premade label ("Sci-Fi" -> "SciFi").
export function premadeValue(label: string): string {
  return normalizeTag(label)
}

const PREMADE_BY_KEY = new Map(PREMADE_TAGS.map((l) => [premadeValue(l).toLowerCase(), premadeValue(l)]))

// Keep only tags from the premade list (case-insensitive), canonical spelling, no duplicates.
// Anything typed by hand or left over from before is dropped.
export function pickPremade(list: unknown): string[] {
  if (!Array.isArray(list)) return []
  const out: string[] = []
  for (const raw of list) {
    if (typeof raw !== 'string') continue
    const canonical = PREMADE_BY_KEY.get(normalizeTag(raw).toLowerCase())
    if (canonical && !out.includes(canonical)) out.push(canonical)
  }
  return out
}

// Normalise, drop empties, remove case-insensitive duplicates (order preserved).
export function normalizeTags(list: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of list) {
    const tag = normalizeTag(raw)
    const key = tag.toLowerCase()
    if (tag && !seen.has(key)) {
      seen.add(key)
      out.push(tag)
    }
  }
  return out
}

// Hashtag derived from a project type: "Feature Films" -> "FeatureFilms".
export function typeTag(type?: string | null): string {
  if (!type) return 'FilmProject'
  return normalizeTag(type.replace(/[-_/,]+/g, ' ')) || 'FilmProject'
}

// Everything shown on a card: the type hashtag(s) first, then custom tags, no duplicates.
export function displayHashtags(projectType: string | undefined | null, tags: string[] | undefined | null): string[] {
  const typeParts = (projectType || '')
    .split(/[,/]+/)
    .map((p) => p.trim())
    .filter(Boolean)
  const base = typeParts.length > 0 ? typeParts.map(typeTag) : [typeTag(projectType)]
  return normalizeTags([...base, ...(tags ?? [])]).map((t) => `#${t}`)
}
