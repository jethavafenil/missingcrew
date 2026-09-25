'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface PhoneVerificationProps {
  phoneNumber: string
  onVerificationComplete: (verified: boolean) => void
}

export function PhoneVerification({ phoneNumber, onVerificationComplete }: PhoneVerificationProps) {
  const [verificationCode, setVerificationCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Send OTP via backend (Twilio)
  const sendVerificationCode = async () => {
    setIsVerifying(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/auth/phone/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data?.message || 'Failed to send verification code')
      }
      setIsCodeSent(true)
      setSuccess(data.devCode ? `Code generated (dev): ${data.devCode}` : 'Verification code sent successfully!')
    } catch (err: any) {
      setError(err?.message || 'Failed to send verification code. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  // Verify OTP via backend
  const verifyCode = async () => {
    setIsVerifying(true)
    setError('')
    setSuccess('')

    try {
      if (verificationCode.length !== 6) {
        setError('Invalid verification code. Please enter a 6-digit code.')
        return
      }
      const res = await fetch('/api/auth/phone/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, code: verificationCode })
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data?.message || 'Failed to verify code')
      }
      setSuccess('Phone number verified successfully!')
      onVerificationComplete(true)
    } catch (err: any) {
      setError(err?.message || 'Failed to verify code. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Phone Verification</h3>

      {!isCodeSent ? (
        <div>
          <p className="mb-4">
            We need to verify your phone number: <strong>{phoneNumber}</strong>
          </p>
          <Button
            onClick={sendVerificationCode}
            disabled={isVerifying || !phoneNumber}
          >
            {isVerifying ? 'Sending...' : 'Send Verification Code'}
          </Button>
        </div>
      ) : (
        <div>
          <p className="mb-4">
            We&apos;ve sent a verification code to <strong>{phoneNumber}</strong>.
            Please enter it below:
          </p>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter 6-digit code"
              className="flex-1 border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
              maxLength={6}
            />
            <Button
              onClick={verifyCode}
              disabled={isVerifying || verificationCode.length !== 6}
            >
              {isVerifying ? 'Verifying...' : 'Verify'}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}
    </div>
  )
}
