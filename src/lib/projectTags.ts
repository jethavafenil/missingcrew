// Custom project hashtags: producers may add up to MAX_PROJECT_TAGS free-text tags
// on top of the hashtag derived from the project type. Suggestions are only hints.

export const MAX_PROJECT_TAGS = 3
export const MAX_TAG_LENGTH = 30

// RegExp constructor: the tsconfig target predates the /u regex-literal flag.
const NON_ALNUM = new RegExp(String.raw`[^\p{L}\p{N}]`, 'gu')

// Starter suggestions (the client will supply the final list).
export const SUGGESTED_TAGS = [
  'Thriller', 'Comedy', 'Drama', 'Romance', 'Action', 'Horror', 'Fantasy', 'SciFi',
  'Documentary', 'Fashion', 'Travel', 'Food', 'Wedding', 'Corporate', 'Social',
  'Bollywood', 'Regional', 'Independent', 'Student', 'Paid', 'Urgent', 'Night Shoot',
] as const

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
