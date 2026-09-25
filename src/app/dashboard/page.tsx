import { CrewDashboard } from '@/components/dashboard/CrewDashboard'
import { EmployerDashboard } from '@/components/dashboard/EmployerDashboard'
import { requireUser } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { requesterFromSession, userRepo } from '@/lib/repo'

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export default async function DashboardPage() {
  const session = await requireUser()
  // Admins have no crew/employer dashboard — send them to /admin instead of
  // rendering the employer dashboard with no profile data.
  if (session.user.role === 'ADMIN') redirect('/admin')
  const user = await userRepo.findById(session.user.id, requesterFromSession(session))
  if (!user) return null

  const userData = serialize({
    email: user.email,
    name: user.name ?? undefined,
    role: user.role,
    ...(user.role === 'CREW' && user.crewProfile ? { crewProfile: user.crewProfile } : {}),
    ...(user.role === 'EMPLOYER' && user.employerProfile ? { employerProfile: user.employerProfile } : {}),
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30">
      {session.user.role === 'CREW' ? (
        <CrewDashboard user={{ name: session.user.name ?? undefined }} userData={userData as any} />
      ) : (
        <EmployerDashboard user={{ name: session.user.name ?? undefined }} userData={userData as any} />
      )}
    </div>
  )
}
