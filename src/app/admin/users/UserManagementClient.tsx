'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

type UserListItem = {
  id: string
  name?: string | null
  email: string
  phone?: string | null
  role: 'ADMIN' | 'CREW' | 'EMPLOYER'
  createdAt: string | Date
  formattedCreatedAt?: string
  crewProfile?: { city?: string | null } | null
  employerProfile?: { companyName?: string | null } | null
  subscriptions?: { plan?: { name?: string | null } | null } | null
}

export default function UserManagementClient({
  users,
  totalPages,
  currentPage,
  totalUsers
}: {
  users: UserListItem[]
  totalPages: number
  currentPage: number
  totalUsers: number
}) {
  const searchParams = useSearchParams()
  const roleFilter = searchParams.get('role') || ''
  const searchQuery = searchParams.get('search') || ''

  // Format user data for display
  const formatRole = (role: string) => {
    const roles: Record<string, string> = {
      ADMIN: 'Admin',
      CREW: 'Crew Member',
      EMPLOYER: 'Employer'
    }
    return roles[role] || role
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-gray-600 text-sm">
            Manage all users, their roles, and account status
          </p>
        </div>
        <div className="flex space-x-4">
          <Link
            href="/admin/users/import"
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Bulk Import
          </Link>
          <Link
            href="/admin/users/new"
            className="px-4 py-2 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-700"
          >
            Add User
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search Users
          </label>
          <form method="GET" action="/admin/users">
            <div className="relative">
              <input
                type="text"
                id="search"
                name="search"
                defaultValue={searchQuery}
                placeholder="Search by name or email"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              {roleFilter && <input type="hidden" name="role" value={roleFilter} />}
              <button type="submit" className="absolute right-2 top-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Role
          </label>
          <form method="GET" action="/admin/users" className="flex items-center">
            <select
              id="role"
              name="role"
              defaultValue={roleFilter}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="CREW">Crew</option>
              <option value="EMPLOYER">Employer</option>
            </select>
            {searchQuery && <input type="hidden" name="search" value={searchQuery} />}
            <button type="submit" className="ml-2 text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscription
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">
                          {user.crewProfile?.city || user.employerProfile?.companyName || ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                    <div className="text-sm text-gray-500">{user.phone || 'No phone'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                        user.role === 'EMPLOYER' ? 'bg-purple-100 text-purple-800' :
                        'bg-blue-100 text-blue-800'}`}>
                      {formatRole(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.subscriptions
                      ? user.subscriptions.plan?.name || 'Active'
                      : 'None'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.formattedCreatedAt || new Date(user.createdAt).toLocaleDateString('en-US')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-indigo-600 hover:text-indigo-900 mr-2"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/admin/users/${user.id}/delete`}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <div className="flex space-x-2">
            {currentPage > 1 && (
              <Link
                href={`/admin/users?page=${currentPage - 1}${roleFilter ? `&role=${roleFilter}` : ''}${searchQuery ? `&search=${searchQuery}` : ''}`}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Previous
              </Link>
            )}

            <span className="flex items-center px-4 py-2 text-sm font-medium text-gray-700">
              Page {currentPage} of {totalPages}
            </span>

            {currentPage < totalPages && (
              <Link
                href={`/admin/users?page=${currentPage + 1}${roleFilter ? `&role=${roleFilter}` : ''}${searchQuery ? `&search=${searchQuery}` : ''}`}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
