'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'

function SubscriptionSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const success = searchParams.get('success') === 'true'
  const sessionId = searchParams.get('session_id')
  const planName = searchParams.get('plan') || 'subscription'
  const [verifying, setVerifying] = useState(false)

  const verifyStripeSession = async (sessionId: string) => {
    setVerifying(true)
    try {
      // Call an API to verify the session and update subscription
      const response = await fetch('/api/stripe/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })

      if (response.ok) {
        // Subscription verified and updated, redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard?refresh=' + Date.now())
        }, 3000)
      } else {
        console.error('Failed to verify session')
        // Still redirect, webhook might handle it
        setTimeout(() => {
          router.push('/dashboard?refresh=' + Date.now())
        }, 5000)
      }
    } catch (error) {
      console.error('Error verifying session:', error)
      // Still redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard?refresh=' + Date.now())
      }, 5000)
    }
  }

  useEffect(() => {
    // If we have a Stripe session ID, verify and update subscription
    if (sessionId && !verifying) {
      verifyStripeSession(sessionId)
    } else if (success) {
      // Razorpay success - redirect after delay
      const timer = setTimeout(() => {
        router.push('/dashboard?refresh=' + Date.now())
      }, 5000)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, sessionId, success])

  const isSuccess = sessionId || success

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Subscription {isSuccess ? 'Successful' : 'Failed'}</h1>
      </div>

      {isSuccess ? (
        <Card className="border-green-200">
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center justify-center text-green-800">
              <CheckCircle className="h-6 w-6 mr-2" />
              Subscription Successful
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-green-700 mb-4">
              Thank you for subscribing to the {planName} plan!
            </p>
            <p className="text-green-700 mb-6">
              You now have access to all the premium features of MissingCrew.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to your dashboard in 5 seconds...
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-red-200">
          <CardHeader className="bg-red-50">
            <CardTitle className="flex items-center justify-center text-red-800">
              <AlertTriangle className="h-6 w-6 mr-2" />
              Subscription Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-red-700 mb-4">
              We{"'"}re sorry, but we couldn{"'"}t process your subscription.
            </p>
            <p className="text-red-700 mb-6">
              Please try again or contact support if the issue persists.
            </p>
            <Button
              onClick={() => router.push('/subscription-plans')}
              variant="outline"
              className="text-red-700 border-red-200 hover:bg-red-50"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 text-center">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard')}
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  )
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense>
      <SubscriptionSuccessContent />
    </Suspense>
  )
}
