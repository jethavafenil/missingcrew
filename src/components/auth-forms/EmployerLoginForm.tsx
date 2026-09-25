'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signInWithPassword } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function EmployerLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get('role') || 'employer'
  const intent = searchParams.get('intent') // Track user intent (e.g., 'post-requirement')
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

      try {
        // Determine callback URL based on intent
        const callbackUrl = intent === 'post-requirement'
          ? '/employer/post-requirement'
          : '/employer-home'

        const result = await signInWithPassword({
          email: formData.email,
          password: formData.password,
          expectedRole: 'EMPLOYER',
          callbackUrl,
        })

        if (!result.ok) {
          setError(result.error || 'Failed to login. Please check your credentials.')
        } else {
          router.push(result.url || callbackUrl)
        }
      } catch (err) {
        console.error('Employer login failed:', err)
        setError('Failed to login. Please check your credentials.')
      } finally {
        setIsLoading(false)
      }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email address
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          value={formData.email}
          onChange={handleChange}
          className="mt-1"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          value={formData.password}
          onChange={handleChange}
          className="mt-1"
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200" 
        disabled={isLoading}
      >
        {isLoading ? 'Logging in...' : 'Login as Employer'}
      </Button>
    </form>
  )
}
