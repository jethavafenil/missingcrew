'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SubscriptionPlans } from '@/components/subscription/SubscriptionPlans'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

function SubscriptionPlansContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [userData, setUserData] = useState<{
    crewProfile?: {
      subscriptionTier: 'FREE_TRIAL' | 'BASIC' | 'PRO'
      trialEnds?: string
    }
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const data = await response.json()
          setUserData(data)
        }
      } catch (err) {
        console.error('Error fetching user data:', err)
        setError('Failed to load user data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const handleContinue = () => {
    router.push('/dashboard')
  }

  // Check if trial has expired
  const isTrialExpired = searchParams.get('expired') === 'true'

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
          Crew Subscription Plans
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Upgrade your profile to get more visibility, apply to unlimited projects, and get hired faster
        </p>
      </div>

      {/* Trial Expired Warning */}
      {isTrialExpired && (
        <Card className="mb-8 border-yellow-200">
          <CardHeader className="bg-yellow-50">
            <CardTitle className="flex items-center text-yellow-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Your Free Trial Has Expired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700 mb-4">
              Your free trial period has ended. To continue using all features of MissingCrew,
              please choose a subscription plan below.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Current Subscription Info */}
      {userData && !isLoading && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Current Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            {userData.crewProfile?.subscriptionTier === 'PRO' && (
              <div className="flex items-center p-4 bg-purple-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-purple-600 mr-3" />
                <div>
                  <h3 className="font-medium text-purple-800">Pro Member</h3>
                  <p className="text-sm text-purple-600">
                    You have access to all premium features.
                  </p>
                </div>
              </div>
            )}

            {userData.crewProfile?.subscriptionTier === 'BASIC' && (
              <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-blue-600 mr-3" />
                <div>
                  <h3 className="font-medium text-blue-800">Basic Member</h3>
                  <p className="text-sm text-blue-600">
                    You have access to basic features. Upgrade to Pro for more benefits.
                  </p>
                </div>
              </div>
            )}

            {userData.crewProfile?.subscriptionTier === 'FREE_TRIAL' && (
              <div className="flex items-center p-4 bg-yellow-50 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-yellow-600 mr-3" />
                <div>
                  <h3 className="font-medium text-yellow-800">Free Trial</h3>
                  <p className="text-sm text-yellow-600">
                    Your trial expires on {userData.crewProfile.trialEnds ?
                      new Date(userData.crewProfile.trialEnds).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Subscription Plans */}
      <SubscriptionPlans />

      {/* Benefits Comparison */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-center">Why Upgrade?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Higher Visibility</h3>
              <p className="text-sm text-gray-600">Pro members appear higher in employer searches and get featured in recommended crew</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Unlimited Applications</h3>
              <p className="text-sm text-gray-600">Apply to as many projects as you want without any monthly limits</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Verified Badge</h3>
              <p className="text-sm text-gray-600">Stand out with a verified badge that builds trust with employers</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Continue Button */}
      <div className="mt-8 text-center">
        <Button
          variant="outline"
          onClick={handleContinue}
          className="px-6 py-2"
        >
          Continue to Dashboard
        </Button>
      </div>
    </div>
  )
}

export default function SubscriptionPlansPage() {
  return (
    <Suspense>
      <SubscriptionPlansContent />
    </Suspense>
  )
}
