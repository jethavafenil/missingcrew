import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Browse Film Crew | MissingCrew',
  description: 'Discover film and production professionals by role, location, experience, and availability.',
  openGraph: {
    title: 'Browse Film Crew | MissingCrew',
    description: 'Discover film and production professionals for your next project.',
    type: 'website',
  },
}

export default function BrowseCrewLayout({ children }: { children: React.ReactNode }) {
  return children
}
