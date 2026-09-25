import { getSession } from '@/lib/auth/server'
import { redirect, notFound } from 'next/navigation'
import { userRepo, requesterFromSession } from '@/lib/repo'
import UserEditForm from './UserEditForm'

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()

  // If not logged in, redirect to admin signin page
  if (!session) {
    redirect('/auth/admin-signin')
  }

  // If not admin, redirect to dashboard
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const { id } = await params

  // Get user data
  const user = await userRepo.findByIdWithSubscriptions(id, requesterFromSession(session))

  if (!user) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <UserEditForm user={user} />
      </div>
    </div>
  )
}
