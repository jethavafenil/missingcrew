// What a visitor who is not signed in may see on a crew profile. Card-level information
// (name, photo, roles, city, showreel, tags, stats) stays public; work links, IMDb and
// contact details need an account. Applied server-side so it cannot be bypassed.

export interface GuestStrippable {
  imdbLink?: string | null
  portfolioLinks?: unknown[] | null
  pastProjects?: unknown
  referredBy?: string | null
}

export function stripGuestProfile<T extends GuestStrippable>(crew: T): T & { linksHidden: true } {
  const pastProjects = Array.isArray(crew.pastProjects)
    ? crew.pastProjects.map((p) => (p && typeof p === 'object' ? { ...(p as Record<string, unknown>), link: null } : p))
    : crew.pastProjects
  return {
    ...crew,
    imdbLink: null,
    portfolioLinks: [],
    pastProjects,
    referredBy: null,
    linksHidden: true,
  }
}
