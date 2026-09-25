import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard | MissingCrew',
  description: 'Manage your MissingCrew profile, projects, applications, and account.',
  robots: { index: false, follow: false },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
