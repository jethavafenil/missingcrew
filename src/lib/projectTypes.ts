// Single list of project types used by the post-project form, the project
// filters, the crew filters and the crew profile. Existing values keep their
// exact spelling because projects store the type as plain text.
export const PROJECT_TYPES = [
  'Ads',
  'Web Series',
  'Feature Films',
  'Documentary',
  'Music Video',
  'TV Show',
  'Short Film',
  'Corporate Video',
] as const

export type ProjectType = (typeof PROJECT_TYPES)[number]

// Application questions pre-filled for every new project (editable/removable).
export const DEFAULT_SCREENING_QUESTIONS = [
  'Have you done this type of project before?',
  'Have you worked with the required equipment/software?',
] as const
