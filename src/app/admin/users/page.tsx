import { getSession } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { userRepo, assertAdmin, requesterFromSession, type UserRole } from '@/lib/repo'
import UserManagementClient from './UserManagementClient'

export default async function UserManagementPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
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

  // In Next.js 15, searchParams may be a Promise in the type-level checks
  const sp = searchParams ? await searchParams : {}

  // Get filter parameters
  const roleFilter = typeof sp.role === 'string' ? (sp.role as UserRole) : undefined
  const searchQuery = typeof sp.search === 'string' ? sp.search : undefined
  const page = typeof sp.page === 'string' ? parseInt(sp.page) : 1
  const pageSize = 10

  // Build filter for the repo query (only apply role filter if explicitly
  // selected, not the default "All Roles")
  const filter: userRepo.AdminUserFilter = {}
  if (roleFilter) {
    filter.role = roleFilter
  }
  if (searchQuery) {
    filter.search = searchQuery
  }
  filter.skip = (page - 1) * pageSize
  filter.take = pageSize

  const requester = assertAdmin(requesterFromSession(session))

  // Get users with pagination
  const { users } = await userRepo.findAdminUsers(filter, requester)

  // Map to client-friendly shape to satisfy UserManagementClient props
  type AdminUserListItem = {
  id: string
  name: string | null
  email: string
  phone: string | null
  role: any
  createdAt: string
  formattedCreatedAt: string
  crewProfile: { city: string | null } | null
  employerProfile: { companyName: string | null } | null
  subscriptions: { plan: { name: string | null } | null } | null
}

const usersForClient: AdminUserListItem[] = users.map((u) => {
    const crewProfile = u.crewProfile as { city?: string | null } | null | undefined
    const employerProfile = u.employerProfile as { companyName?: string | null } | null | undefined
    const subscription = Array.isArray(u.subscriptions) ? u.subscriptions[0] as { plan?: { name?: string | null } | null } | undefined : undefined
    return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone ?? null,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
    formattedCreatedAt: u.createdAt.toLocaleDateString('en-US'),
    crewProfile: crewProfile ? { city: crewProfile.city ?? null } : null,
    employerProfile: employerProfile ? { companyName: employerProfile.companyName ?? null } : null,
    // Subscription is a single record per user; include plan name if loaded
    subscriptions: subscription ? { plan: subscription.plan ? { name: subscription.plan.name ?? null } : null } : null,
  }
  })

  // Get total count for pagination
  const totalUsers = await userRepo.countAdminUsers(filter, requester)
  const totalPages = Math.ceil(totalUsers / pageSize)

  return (
    <UserManagementClient
      users={usersForClient}
      totalPages={totalPages}
      currentPage={page}
      totalUsers={totalUsers}
    />
  )
}
