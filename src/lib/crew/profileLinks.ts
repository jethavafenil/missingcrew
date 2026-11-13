// Profile links: a crew member keeps up to 10 links on their profile and picks which of them
// (plus IMDb, showreel and past-project links) go with each application.

export const MAX_PROFILE_LINKS = 10
export const MAX_LINK_LENGTH = 300

export type LinkKind = 'portfolio' | 'imdb' | 'showreel' | 'project'

export interface ProfileLink {
  url: string
  label: string
  kind: LinkKind
}

// Valid http(s) URL, normalised the way the browser would write it; otherwise null.
export function cleanLink(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const value = raw.trim()
  if (!value || value.length > MAX_LINK_LENGTH) return null
  try {
    const url = new URL(value.includes('://') ? value : `https://${value}`)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    if (!url.hostname.includes('.')) return null
    return url.toString()
  } catch {
    return null
  }
}

// The profile link list as saved: valid links only, no duplicates, at most 10.
// Entries may be strings or { url } objects (older data).
export function sanitizeProfileLinks(list: unknown): string[] {
  if (!Array.isArray(list)) return []
  const out: string[] = []
  for (const item of list) {
    const raw = typeof item === 'string' ? item : item && typeof item === 'object' ? (item as { url?: unknown }).url : null
    const link = cleanLink(raw)
    if (link && !out.includes(link)) out.push(link)
    if (out.length >= MAX_PROFILE_LINKS) break
  }
  return out
}

export function linkLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

interface ProfileLinkSource {
  portfolioLinks?: unknown
  imdbLink?: string | null
  showreelUrl?: string | null
  pastProjects?: unknown
}

// Everything a crew member could attach to an application.
export function collectProfileLinks(profile: ProfileLinkSource): ProfileLink[] {
  const out: ProfileLink[] = []
  const add = (raw: unknown, kind: LinkKind, label?: string) => {
    const url = cleanLink(raw)
    if (url && !out.some((l) => l.url === url)) out.push({ url, kind, label: label ?? linkLabel(url) })
  }
  add(profile.showreelUrl, 'showreel', 'Showreel')
  add(profile.imdbLink, 'imdb', 'IMDb profile')
  for (const link of sanitizeProfileLinks(profile.portfolioLinks)) add(link, 'portfolio')
  if (Array.isArray(profile.pastProjects)) {
    for (const p of profile.pastProjects) {
      if (p && typeof p === 'object') {
        const proj = p as { title?: string; link?: string | null }
        add(proj.link, 'project', proj.title ? `${proj.title} (work link)` : undefined)
      }
    }
  }
  return out
}

// Keep only the chosen links that really belong to this profile (nobody can attach a link
// that is not on their profile). Order and the 15-link ceiling are fixed here.
export function pickAllowedLinks(chosen: unknown, profile: ProfileLinkSource): string[] {
  if (!Array.isArray(chosen)) return []
  const allowed = new Map(collectProfileLinks(profile).map((l) => [l.url, l.url]))
  const out: string[] = []
  for (const raw of chosen) {
    const link = cleanLink(raw)
    if (link && allowed.has(link) && !out.includes(link)) out.push(link)
  }
  return out
}
