import type { Metadata } from 'next'
import { redirectIfWrongRole } from '@/lib/auth/role-guard'

export const metadata: Metadata = {
  title: 'Find Film Work | MissingCrew',
  description: 'Browse current film, television, and digital production opportunities.',
  openGraph: {
    title: 'Find Film Work | MissingCrew',
    description: 'Browse current production opportunities and find your next role.',
    type: 'website',
  },
}

export default async function FindWorkLayout({ children }: { children: React.ReactNode }) {
  // Find Work is for crew; producers are sent to their own home.
  await redirectIfWrongRole('CREW')
  return children
}
