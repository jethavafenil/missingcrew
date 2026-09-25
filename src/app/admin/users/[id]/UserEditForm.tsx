'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type User = {
  id: string
  name: string | null
  email: string
  phone: string | null
  role: 'ADMIN' | 'CREW' | 'EMPLOYER'
  emailVerified: Date | null
  phoneVerified: boolean
  createdAt: Date
  crewProfile?: any
  employerProfile?: any
  subscriptions?: any
}

export default function UserEditForm({ user }: { user: User }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    emailVerified: !!user.emailVerified,
    phoneVerified: user.phoneVerified
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update user')
      }

      router.push('/admin/users')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete user')
      }

      router.push('/admin/users')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
          <p className="text-sm text-gray-600 mt-1">Update user information and settings</p>
        </div>
        <Link
          href="/admin/users"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to Users
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="CREW">Crew Member</option>
              <option value="EMPLOYER">Employer</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.emailVerified}
              onChange={(e) => setFormData({ ...formData, emailVerified: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Email Verified
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.phoneVerified}
              onChange={(e) => setFormData({ ...formData, phoneVerified: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Phone Verified
            </label>
          </div>
        </div>

        <div className="border-t pt-6 flex justify-between items-center">
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            Delete User
          </button>

          <div className="flex space-x-3">
            <Link
              href="/admin/users"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>

      {/* User Details */}
      <div className="mt-8 pt-6 border-t">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="font-medium text-gray-700">User ID</dt>
            <dd className="text-gray-600 mt-1">{user.id}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-700">Created At</dt>
            <dd className="text-gray-600 mt-1">{new Date(user.createdAt).toLocaleString()}</dd>
          </div>
          {user.crewProfile && (
            <div>
              <dt className="font-medium text-gray-700">Profile Type</dt>
              <dd className="text-gray-600 mt-1">Crew Profile (ID: {user.crewProfile.id})</dd>
            </div>
          )}
          {user.employerProfile && (
            <div>
              <dt className="font-medium text-gray-700">Profile Type</dt>
              <dd className="text-gray-600 mt-1">Employer Profile (ID: {user.employerProfile.id})</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  )
}
