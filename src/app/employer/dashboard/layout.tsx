import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Employer Dashboard | MissingCrew',
  description: 'Manage production projects and applicants on MissingCrew.',
  robots: { index: false, follow: false },
}

export default function EmployerDashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
