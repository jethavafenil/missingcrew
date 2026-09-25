import { getSession } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin | MissingCrew',
  description: 'Manage MissingCrew users, projects, applications, subscriptions, and site settings.',
  robots: { index: false, follow: false },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  // If not logged in, redirect to admin sign in page
  if (!session) {
    redirect('/auth/admin-signin')
  }

  // If not admin, redirect to dashboard
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AdminSidebar />
      <div className="lg:pl-64 flex-1 flex flex-col pt-16 lg:pt-0">
        <AdminHeader session={session} />
        <main className="flex-1 py-6">
          {children}
        </main>
      </div>
    </div>
  )
}
