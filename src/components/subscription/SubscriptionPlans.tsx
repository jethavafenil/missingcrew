'use client'

import { publicEnv } from '@/lib/public-env'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth/session-context'
import { Button } from '../ui/button'
import { loadStripe } from '@stripe/stripe-js'

// Initialize Stripe
const stripePromise = loadStripe(publicEnv.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

interface RazorpayHandlerResponse {
  error: string | null
  payment_id: string
  subscription_id: string
  order_id: string
}

interface RazorpayOptions {
  key: string
  subscription_id: string
  name: string
  description: string
  handler: (response: RazorpayHandlerResponse) => void
  prefill: {
    name: string
    email: string
  }
  theme: {
    color: string
  }
}

declare global {
  interface Window {
    Razorpay: {
      new (options: RazorpayOptions): {
        open(): void
      }
    }
  }
}

interface SubscriptionPlan {
  id: string
  name: string
  price: number
  description: string
  features: string[]
}

export function SubscriptionPlans() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null)
  const [currentStatus, setCurrentStatus] = useState<'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'UNPAID' | null>(null)

  // Subscribing requires an account — send logged-out visitors to
  // sign in/up first; the accounts page returns them here afterwards.
  const goToSignIn = () => {
    router.push('/accounts?tab=signin&intent=subscribe')
  }

  useEffect(() => {
    fetchPlans()
    fetchCurrentSubscription()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/subscriptions/plans')
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans)
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
    }
  }

  const fetchCurrentSubscription = async () => {
    try {
      const res = await fetch('/api/subscriptions/manage')
      if (res.ok) {
        const data = await res.json()
        if (data?.subscription) {
          setCurrentPlanId(data.subscription.planId)
          setCurrentStatus(data.subscription.status)
        } else {
          setCurrentPlanId(null)
          setCurrentStatus(null)
        }
      }
    } catch (e) {
      console.error('Error fetching current subscription:', e)
    }
  }

  const handleSubscribe = async (planId: string) => {
    // Prevent duplicate subscribe if already on this plan
    if (currentPlanId === planId && currentStatus === 'ACTIVE') {
      alert('You already have this plan active.')
      return
    }
    // Not logged in (or session still resolving) — sign in/up first
    if (status !== 'authenticated' || !session?.user) {
      goToSignIn()
      return
    }
    setIsLoading(true)
    try {
      // Use Stripe checkout if available
      const response = await fetch('/api/stripe/checkout', {        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      })

      if (response.ok) {
        const data = await response.json()

        // Redirect to Stripe Checkout
        if (data.url) {
          window.location.href = data.url
        } else {
          console.error('No checkout URL returned')
          window.location.href = '/subscription-plans?error=true'
        }
      } else if (response.status === 401) {
        // Session expired mid-flow — back to sign-in, not the failure page
        goToSignIn()
        return
      } else {
        // Try to parse error to detect already active plan
        try {
          const err = await response.json()
          const msg = err?.error || err?.message || ''
          if (typeof msg === 'string' && msg.toLowerCase().includes('already have this plan active')) {
            alert('You already have this plan active.')
            return
          }
        } catch {}
        // Fallback to Razorpay if Stripe fails for other reasons
        console.log('Stripe checkout failed, trying Razorpay fallback...')
        await handleRazorpaySubscribe(planId)
      }
    } catch (error) {
      console.error('Error creating subscription:', error)
      // Fallback to Razorpay
      await handleRazorpaySubscribe(planId)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRazorpaySubscribe = async (planId: string) => {
        setIsLoading(true)
        try {
          const response = await fetch('/api/subscriptions/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ planId }),
          })

          if (response.ok) {
            const data = await response.json()

            // Load Razorpay script dynamically
            const script = document.createElement('script')
            script.src = 'https://checkout.razorpay.com/v1/checkout.js'
            script.async = true
            document.body.appendChild(script)

            script.onload = () => {
              // Initialize Razorpay
              const options = {
                key: data.key,
                subscription_id: data.subscription.id,
                name: 'MissingCrew',
                description: `Subscription for ${planId}`,
                handler: function (response: RazorpayHandlerResponse) {
                  // Redirect to success page after payment
                  fetch('/api/subscriptions/plans')
                    .then(planResponse => planResponse.json())
                    .then(plansData => {
                      const selectedPlan = plansData.plans.find((p: SubscriptionPlan) => p.id === planId)
                      window.location.href = `/subscription-success?success=true&plan=${encodeURIComponent(selectedPlan?.name || '')}&payment_id=${response.payment_id}`
                    })
                },
            prefill: {
                  name: data.subscription.notes?.userName || 'User Name',
                  email: data.subscription.email || 'user@example.com'
                },
                theme: {
                  color: '#3b82f6'
                }
              }

              const rzp = new window.Razorpay(options)
              rzp.open()
            }
          } else if (response.status === 401) {
            goToSignIn()
            return
          } else {
            // Redirect to failure page
            window.location.href = '/subscription-success?success=false'
          }
        } catch (error) {
          console.error('Error creating subscription:', error)
          // Redirect to failure page
          window.location.href = '/subscription-success?success=false'
        } finally {
          setIsLoading(false)
        }
      }


  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      {plans.map((plan) => (
        <div
          key={plan.id}
className="border rounded-lg p-6 border-gray-200"
        >
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
            <div className="mt-4">
              <span className="text-4xl font-bold">₹{plan.price}</span>
              <span className="text-gray-600">/month</span>
            </div>
            <p className="text-gray-600 mt-2">{plan.description}</p>
          </div>

          <ul className="space-y-3 mb-6">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-center">
                <svg
                  className="h-5 w-5 text-green-500 mr-3"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
                {feature}
              </li>
            ))}
          </ul>

          <Button
            onClick={() => handleSubscribe(plan.id)}
            disabled={isLoading || (currentPlanId === plan.id && currentStatus === 'ACTIVE')}
            className="w-full"
            variant="outline"
            title={currentPlanId === plan.id && currentStatus === 'ACTIVE' ? 'You already have this plan active' : undefined}
          >
            {currentPlanId === plan.id && currentStatus === 'ACTIVE'
              ? 'Current Plan'
              : isLoading
                ? 'Processing...'
                : 'Subscribe Now'}
          </Button>
        </div>
      ))}
    </div>
  )
}
