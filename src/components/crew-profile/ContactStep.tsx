'use client'

import { useState } from 'react'
import { PhoneVerification } from './PhoneVerification'

interface ContactData {
  contactWhatsApp: string
  referredBy: string
  phoneVerified: boolean
  phone?: string
  termsAgreed?: boolean
}

interface ContactStepProps {
  data: Partial<ContactData>
  onChange: (data: Partial<ContactData>) => void
}

export function ContactStep({ data, onChange }: ContactStepProps) {
  const [showVerification, setShowVerification] = useState(false)

  const handleVerificationComplete = (verified: boolean) => {
    onChange({ phoneVerified: verified })
    setShowVerification(false)
  }
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Contact & Referral</h2>

      {/* WhatsApp Number */}
      <div>
        <label htmlFor="contactWhatsApp" className="block text-sm font-medium text-gray-700">
          WhatsApp Number
        </label>
        <input
          type="tel"
          id="contactWhatsApp"
          placeholder="+919876543210"
          value={data.contactWhatsApp || ''}
          onChange={(e) => onChange({ contactWhatsApp: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <p className="mt-1 text-sm text-gray-500">
          Employers will contact you on WhatsApp for quick communication
        </p>
      </div>

      {/* Referred By */}
      <div>
        <label htmlFor="referredBy" className="block text-sm font-medium text-gray-700">
          Referred By (Optional)
        </label>
        <input
          type="email"
          id="referredBy"
          placeholder="Email of person who referred you"
          value={data.referredBy || ''}
          onChange={(e) => onChange({ referredBy: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-md">
          <p className="text-sm text-purple-800 font-medium flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Refer friends and get 2 months FREE!
          </p>
          <p className="text-xs text-purple-700 mt-1 ml-6">
            When someone uses your email as referral, YOU get 2 months of free access.
          </p>
        </div>
      </div>

      {/* Profile Completion Summary */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-800 mb-2">🎉 Profile Almost Complete!</h3>
        <p className="text-green-700 mb-4">
          Your profile is looking great! Once you complete this step, you&apos;ll be able to:
        </p>
        <ul className="text-green-700 space-y-2">
          <li className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
            Appear in employer searches
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
            Apply to relevant projects
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
            Get contacted directly by employers
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
            Build your professional network
          </li>
        </ul>
      </div>

      {/* Verification Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">🔐 Verification Status</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-blue-700">Phone Verification</span>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                data.phoneVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {data.phoneVerified ? 'Verified' : 'Pending'}
              </span>
              {!data.phoneVerified && data.phone && (
                <button
                  onClick={() => setShowVerification(true)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Verify Now
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-blue-700">Profile Completion</span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Complete
            </span>
          </div>
        </div>
      </div>

      {/* Phone Verification Modal */}
      {showVerification && data.phone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <PhoneVerification
              phoneNumber={data.phone}
              onVerificationComplete={handleVerificationComplete}
            />
            <button
              onClick={() => setShowVerification(false)}
              className="mt-4 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Terms Acceptance */}
      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          id="acceptTerms"
          checked={data.termsAgreed || false}
          onChange={(e) => onChange({ termsAgreed: e.target.checked })}
          required
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1"
        />
        <label htmlFor="acceptTerms" className="text-sm text-gray-700">
          I agree to the{' '}
          <a href="/terms" target="_blank" className="text-indigo-600 hover:text-indigo-500">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/terms" target="_blank" className="text-indigo-600 hover:text-indigo-500">
            Privacy Policy
          </a>
          . I confirm that all information provided is accurate and I&apos;m available for freelance work in the film industry. *
        </label>
      </div>
    </div>
  )
}
