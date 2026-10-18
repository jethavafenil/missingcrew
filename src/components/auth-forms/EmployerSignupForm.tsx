'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { getPasswordRequirements, isStrongPassword } from '@/lib/auth/password'

export default function EmployerSignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get('role') || 'employer'
  const intent = searchParams.get('intent') // Track user intent (e.g., 'post-requirement')
  const returnUrl = searchParams.get('returnUrl')
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')

  const passwordRequirements = getPasswordRequirements(formData.password)
  const showPasswordHelp = formData.password.length > 0 && !isStrongPassword(formData.password)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!isStrongPassword(formData.password)) {
      setError('Please fix password errors before submitting')
      setIsLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register/employer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      body: JSON.stringify({
        companyName: formData.companyName,
        contactName: formData.contactName,
        email: formData.email,
        password: formData.password
      }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create account. Please try again.')
        return
      }

    // Show success message and redirect to signin with intent and returnUrl parameters
    setError('')
    const intentParam = intent ? `&intent=${intent}` : ''
    const returnUrlParam = returnUrl ? `&returnUrl=${encodeURIComponent(returnUrl)}` : ''
    router.push(`/accounts?tab=signin&role=employer&message=${data.verificationRequired ? 'VerifyEmail' : 'RegistrationSuccessful'}&email=${encodeURIComponent(formData.email)}${intentParam}${returnUrlParam}`)
    return
    } catch (err) {
      console.error('Employer signup failed:', err)
      setError('Failed to create account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form method="post" onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
          Company Name
        </label>
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
        <label htmlFor="contactName" className="block text-sm font-medium text-gray-700">
          Contact Name
        </label>
        <Input
          id="contactName"
          name="contactName"
          type="text"
          required
          placeholder="Your full name"
          autoComplete="name"
          value={formData.contactName}
          onChange={handleChange}
          className="mt-1"
        />
      </div>

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
        <PasswordInput
          id="password"
          name="password"
          required
          value={formData.password}
          onChange={handleChange}
          className="mt-1"
          autoComplete="new-password"
        />
        {showPasswordHelp && (
          <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">Password must contain:</p>
            <div className="text-xs text-red-600 mt-1">
              <div className={passwordRequirements.length ? 'text-green-600' : ''}>• At least 8 characters</div>
              <div className={passwordRequirements.uppercase ? 'text-green-600' : ''}>• At least one uppercase letter</div>
              <div className={passwordRequirements.lowercase ? 'text-green-600' : ''}>• At least one lowercase letter</div>
              <div className={passwordRequirements.number ? 'text-green-600' : ''}>• At least one number</div>
              <div className={passwordRequirements.specialChar ? 'text-green-600' : ''}>• At least one special character (!@#$%^&*)</div>
            </div>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm Password
        </label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          required
          value={formData.confirmPassword}
          onChange={handleChange}
          className="mt-1"
          autoComplete="new-password"
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
        {isLoading ? 'Signing up...' : 'Sign up as Employer'}
      </Button>
    </form>
  )
}
