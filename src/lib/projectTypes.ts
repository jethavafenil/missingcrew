// Single list of project types used by the post-project form, the project filters, the crew
// filters, the crew profile (types they work on, type of each past project) and matching, so a
// crew member's work lines up with what a producer posts.

export const PROJECT_TYPE_GROUPS: ReadonlyArray<{ group: string; types: readonly string[] }> = [
  {
    group: 'Film & television',
    types: [
      'Feature Film', 'Short Film', 'Independent Film', 'Documentary Film', 'Feature Documentary', 'Web Series',
      'Television Series', 'TV Show', 'TV Commercial (TVC)', 'Pilot Episode', 'Anthology Film', 'Student Film',
      'Experimental Film', 'Music Video', 'Reality Show', 'Talk Show', 'News & Broadcast Production',
    ],
  },
  {
    group: 'Advertising & corporate',
    types: [
      'Ad Film', 'Digital Advertisement', 'Brand Film', 'Corporate Film', 'Product Film', 'Promotional Video',
      'Explainer Video', 'Social Media Video', 'Instagram Reel', 'YouTube Video', 'Campaign Film', 'Fashion Film',
      'Real Estate Video',
    ],
  },
  {
    group: 'Digital content & events',
    types: [
      'YouTube Series', 'Podcast (Video)', 'Live Streaming Production', 'Educational Video', 'Training Video',
      'Interview Video', 'Event Coverage', 'Behind-the-Scenes Video', 'Travel Film', 'Food & Restaurant Video',
    ],
  },
  {
    group: 'Stage, animation & other',
    types: [
      'Theatre & Stage Production', 'Animation Film', 'VFX Production', 'Gaming Cinematics', 'Wedding Film',
      'Photography Campaign', 'Fashion Shoot', 'Corporate Event Production', 'Music Performance Film', 'Other',
    ],
  },
]

export const PROJECT_TYPES: string[] = PROJECT_TYPE_GROUPS.flatMap((g) => [...g.types])

export type ProjectType = string

// Options for the searchable pickers (grouped).
export const PROJECT_TYPE_OPTIONS = PROJECT_TYPE_GROUPS.flatMap((g) => g.types.map((t) => ({ value: t, group: g.group })))

// Older names that were saved before the list was extended. They are mapped to the new names
// (the database migration 0019 does the same for stored data) so nothing stops matching.
const LEGACY: Record<string, string> = {
  ads: 'Ad Film',
  'ad films': 'Ad Film',
  'feature films': 'Feature Film',
  documentary: 'Documentary Film',
  'corporate video': 'Corporate Film',
  commercial: 'Ad Film',
  'tv series': 'Television Series',
}

export function canonicalProjectType(raw: string): string {
  const t = raw.trim()
  return LEGACY[t.toLowerCase()] ?? t
}

// A project can have several types, stored as one comma-separated text ("Ad Film, Brand Film").
export const MAX_PROJECT_TYPES = 5

export function splitProjectTypes(value: string | null | undefined): string[] {
  return (value || '')
    .split(',')
    .map((t) => canonicalProjectType(t))
    .filter(Boolean)
}

export function joinProjectTypes(types: string[]): string {
  return Array.from(new Set(types.map((t) => t.trim()).filter(Boolean))).join(', ')
}

// Application questions pre-filled for every new project (editable/removable).
export const DEFAULT_SCREENING_QUESTIONS = [
  'Have you done this type of project before?',
  'Have you worked with the required equipment/software?',
] as const
