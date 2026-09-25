'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/lib/auth/session-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function EmployerProfileSetup() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    companyName: '',
    companyWebsite: '',
  })
  const [error, setError] = useState('')
  const [showCrewAlert, setShowCrewAlert] = useState(false)

  useEffect(() => {
    if (!session) {
      router.push('/accounts?tab=signin&role=employer')
    } else if (session.user?.role === 'CREW') {
      setShowCrewAlert(true)
    } else if (session.user?.role !== 'EMPLOYER') {
      // Redirect to dashboard if user is not an employer
      router.push('/dashboard')
    }
  }, [session, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/employer/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: formData.companyName,
          companyWebsite: formData.companyWebsite,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to update profile. Please try again.')
        return
      }

      // Redirect to dashboard with profile completed parameter
      router.push('/dashboard?profile=completed')
    } catch (err) {
      console.error('Error updating profile:', err)
      setError('Failed to update profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {showCrewAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Access Restricted</h2>
            <p className="mb-4">
              This page is for employers only. As a crew member, you can post your profile
              <Link href="/crew/profile-setup" className="text-blue-600 hover:underline ml-1">here</Link>.
            </p>
            <div className="flex justify-end">
              <Button 
                onClick={() => router.push('/dashboard')}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Complete Your Employer Profile</h1>
        <p className="text-gray-600 mt-2">
          Please provide some basic information about your company to complete your profile.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              name="companyName"
              type="text"
              required
              value={formData.companyName}
              onChange={handleChange}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="companyWebsite">Company Website (optional)</Label>
            <Input
              id="companyWebsite"
              name="companyWebsite"
              type="url"
              value={formData.companyWebsite}
              onChange={handleChange}
              className="mt-1"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isLoading}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Complete Profile'}
          </Button>
        </div>
      </form>
    </div>
  )
}
