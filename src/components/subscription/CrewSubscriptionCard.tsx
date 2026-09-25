'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { CheckCircle, Star, Zap, AlertTriangle, ArrowRight } from 'lucide-react'

interface CrewSubscriptionCardProps {
  subscriptionTier: 'FREE_TRIAL' | 'BASIC' | 'PRO'
  trialEnds?: string | null
}

export function CrewSubscriptionCard({ subscriptionTier, trialEnds }: CrewSubscriptionCardProps) {
  const [planDetails, setPlanDetails] = useState<{
    name: string
    price: number
    features: string[]
  } | null>(null)

  const fetchPlanDetails = async (tier: CrewSubscriptionCardProps['subscriptionTier']) => {
    try {
      const response = await fetch('/api/subscriptions/plans')
      if (response.ok) {
        const data = await response.json()
        const plans = data.plans || []

        // Map subscription tier to plan name
        let planName = 'Basic Profile'
        if (tier === 'PRO') {
          planName = 'Pro Profile'
        }

        const plan = plans.find((p: { name: string; price: number; features: string[] }) => p.name === planName)
        if (plan) {
          setPlanDetails(plan)
        }
      }
    } catch (error) {
      console.error('Error fetching plan details:', error)
    }
  }

  useEffect(() => {
    fetchPlanDetails(subscriptionTier)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptionTier])

  const getPlanIcon = () => {
    switch (subscriptionTier) {
      case 'PRO':
        return <Star className="h-6 w-6 text-yellow-500" fill="currentColor" />
      case 'BASIC':
        return <Zap className="h-6 w-6 text-blue-500" />
      case 'FREE_TRIAL':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />
      default:
        return null
    }
  }

  const getPlanBadgeColor = () => {
    switch (subscriptionTier) {
      case 'PRO':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-100'
      case 'BASIC':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100'
      case 'FREE_TRIAL':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
    }
  }

  const getPlanName = () => {
    switch (subscriptionTier) {
      case 'PRO':
        return 'Pro Member'
      case 'BASIC':
        return 'Basic Member'
      case 'FREE_TRIAL':
        return 'Free Trial'
      default:
        return 'No Plan'
    }
  }

  const getFeatures = () => {
    if (planDetails) {
      return planDetails.features
    }
    
    // Fallback features if API fails
    switch (subscriptionTier) {
      case 'PRO':
        return [
          'Unlimited job applications',
          'Appear higher in employer search',
          'Verified badge',
          '5 portfolio links',
          'Featured in "Recommended Crew"',
          'Priority support'
        ]
      case 'BASIC':
        return [
          'Appear in crew search',
          'Apply to 10 gigs/month',
          'Show availability status',
          '2 Portfolio links',
          'Basic profile visibility'
        ]
      case 'FREE_TRIAL':
        return [
          'Limited access to features',
          'Apply to 3 gigs/month',
          'Basic profile visibility',
          'Trial period access'
        ]
      default:
        return []
    }
  }

  const isTrialExpired = trialEnds && new Date(trialEnds) < new Date()
  const daysUntilExpiry = trialEnds 
    ? Math.ceil((new Date(trialEnds).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <Card className="overflow-hidden">
      <CardHeader className={`${
        subscriptionTier === 'PRO' 
          ? 'bg-gradient-to-r from-purple-600 to-indigo-600' 
          : subscriptionTier === 'BASIC'
          ? 'bg-gradient-to-r from-blue-600 to-cyan-600'
          : 'bg-gradient-to-r from-yellow-500 to-orange-500'
      } text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getPlanIcon()}
            <div>
              <CardTitle className="text-xl font-bold text-white">Your Subscription</CardTitle>
              <Badge variant="secondary" className={`mt-2 ${getPlanBadgeColor()}`}>
                {getPlanName()}
              </Badge>
            </div>
          </div>
          {planDetails && subscriptionTier !== 'FREE_TRIAL' && (
            <div className="text-right">
              <div className="text-3xl font-bold">₹{planDetails.price}</div>
              <div className="text-sm text-white/80">per month</div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Trial Expiration Warning */}
        {subscriptionTier === 'FREE_TRIAL' && trialEnds && (
          <div className={`mb-4 p-3 rounded-lg ${
            isTrialExpired 
              ? 'bg-red-50 border border-red-200' 
              : daysUntilExpiry && daysUntilExpiry <= 7
              ? 'bg-yellow-50 border border-yellow-200'
              : 'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-start">
              <AlertTriangle className={`h-5 w-5 mt-0.5 mr-2 ${
                isTrialExpired 
                  ? 'text-red-600' 
                  : daysUntilExpiry && daysUntilExpiry <= 7
                  ? 'text-yellow-600'
                  : 'text-blue-600'
              }`} />
              <div>
                <p className={`text-sm font-medium ${
                  isTrialExpired 
                    ? 'text-red-800' 
                    : daysUntilExpiry && daysUntilExpiry <= 7
                    ? 'text-yellow-800'
                    : 'text-blue-800'
                }`}>
                  {isTrialExpired 
                    ? 'Your free trial has expired' 
                    : `Trial expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`
                  }
                </p>
                <p className={`text-xs mt-1 ${
                  isTrialExpired 
                    ? 'text-red-600' 
                    : daysUntilExpiry && daysUntilExpiry <= 7
                    ? 'text-yellow-600'
                    : 'text-blue-600'
                }`}>
                  {isTrialExpired 
                    ? 'Upgrade now to continue accessing all features'
                    : `Expires on ${new Date(trialEnds).toLocaleDateString()}`
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Plan Features */}
        <div className="space-y-3 mb-6">
          <h4 className="font-semibold text-gray-900">Your Plan Includes:</h4>
          <ul className="space-y-2">
            {getFeatures().map((feature, index) => (
              <li key={index} className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {subscriptionTier === 'FREE_TRIAL' && (
            <Link href="/subscription-plans" className="block">
              <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                Upgrade to Premium
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
          
          {subscriptionTier === 'BASIC' && (
            <Link href="/subscription-plans" className="block">
              <Button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white">
                Upgrade to Pro
                <Star className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}

          {subscriptionTier === 'PRO' && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm text-green-800 font-medium">
                  You&apos;re on the best plan! Enjoy all premium features.
                </span>
              </div>
            </div>
          )}

          <Link href="/subscription-management" className="block">
            <Button variant="outline" className="w-full">
              Manage Subscription
            </Button>
          </Link>

          <Link href="/subscription-plans" className="block">
            <Button variant="outline" className="w-full">
              View All Plans
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
