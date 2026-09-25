'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function CrewSignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get('role') || 'crew'
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Validate password requirements in real-time
    if (name === 'password') {
      validatePassword(value)
    }
  }

  const validatePassword = (password: string) => {
    // Check password requirements
    const hasLength = password.length >= 8
    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    setPasswordRequirements({
      length: hasLength,
      uppercase: hasUppercase,
      lowercase: hasLowercase,
      number: hasNumber,
      specialChar: hasSpecialChar
    })

    // Check if all requirements are met
    if (hasLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar) {
      setPasswordError('')
    } else {
      setPasswordError('Invalid password')
    }
  }

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsLoading(true)
  setError('')

  // Check if password meets all requirements
  if (passwordError) {
    setError('Please fix password errors before submitting')
    setIsLoading(false)
    return
  }

  // Check if passwords match
  if (formData.password !== formData.confirmPassword) {
    setError('Passwords do not match')
    setIsLoading(false)
    return
  }

  try {
    const response = await fetch('/api/auth/register/crew', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        password: formData.password
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      setError(data.error || 'Failed to create account. Please try again.')
      return
    }

    // GoTrue requires email verification before sign-in is possible, so send
    // the user to the sign-in tab with a success message.
    setError('')
    router.push(`/accounts?tab=signin&role=crew&message=RegistrationSuccessful&email=${encodeURIComponent(formData.email)}`)
    return
  } catch (err) {
    console.error('Crew signup failed:', err)
    setError('Failed to create account. Please try again.')
  } finally {
    setIsLoading(false)
  }
}

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Full Name
        </label>
<Input
  id="name"
  name="name"
  type="text"
  required
  value={formData.name}
  onChange={handleChange}
  className="mt-1"
  autoComplete="name"
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
  autoComplete="email"
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
          autoComplete="new-password"
        />
        {passwordError && (
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
<Input
  id="confirmPassword"
  name="confirmPassword"
  type="password"
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
        {isLoading ? 'Signing up...' : 'Sign up as Crew Member'}
      </Button>
    </form>
  )
}
