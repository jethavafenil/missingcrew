import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Find Film Work | MissingCrew',
  description: 'Browse current film, television, and digital production opportunities.',
  openGraph: {
    title: 'Find Film Work | MissingCrew',
    description: 'Browse current production opportunities and find your next role.',
    type: 'website',
  },
}

export default function FindWorkLayout({ children }: { children: React.ReactNode }) {
  return children
}
