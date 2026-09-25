'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Calendar, 
  CreditCard, 
  Star,
  RefreshCw,
  ArrowRight,
  Settings
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'

interface SubscriptionData {
  subscription: {
    id: string
    planId: string
    status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'UNPAID'
    currentPeriodStart: string
    currentPeriodEnd: string
    razorpaySubscriptionId?: string
    plan: {
      id: string
      name: string
      price: number
      description: string
      features: string[]
    }
  } | null
  crewProfile: {
    subscriptionTier: 'FREE_TRIAL' | 'BASIC' | 'PRO'
    trialEnds?: string | null
  } | null
}

export function SubscriptionManagement() {
  const router = useRouter()
  const [data, setData] = useState<SubscriptionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSubscriptionData()
  }, [])

  const fetchSubscriptionData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/subscriptions/manage')
      if (response.ok) {
        const result = await response.json()
        setData(result)
      } else {
        setError('Failed to load subscription data')
      }
    } catch (err) {
      console.error('Error fetching subscription:', err)
      setError('An error occurred while loading subscription data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    try {
      setActionLoading(true)
      const response = await fetch('/api/subscriptions/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' })
      })

      if (response.ok) {
        await fetchSubscriptionData()
        setShowCancelDialog(false)
        
        // Force redirect to dashboard with cache bust to refresh the data
        router.push('/dashboard?refresh=' + Date.now())
        router.refresh()
      } else {
        const error = await response.json()
        setError(error.message || 'Failed to cancel subscription')
      }
    } catch (err) {
      console.error('Error canceling subscription:', err)
      setError('An error occurred while canceling subscription')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
      case 'CANCELED':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Canceled</Badge>
      case 'PAST_DUE':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Past Due</Badge>
      case 'UNPAID':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Unpaid</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <RefreshCw className="h-12 w-12 animate-spin text-indigo-600 mb-4" />
        <p className="text-gray-600">Loading subscription details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="flex items-center text-red-600">
            <XCircle className="h-5 w-5 mr-2" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const tier = data?.crewProfile?.subscriptionTier || 'FREE_TRIAL'
  const subscription = data?.subscription
  const hasActiveSubscription = subscription && subscription.status === 'ACTIVE'

  return (
    <div className="space-y-6">
      {/* Current Plan Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Settings className="h-6 w-6 text-indigo-600" />
                Subscription Management
              </CardTitle>
              <CardDescription className="mt-2">
                Manage your subscription plan and billing
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchSubscriptionData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Plan */}
            <div className={`p-6 rounded-lg border-2 ${
              tier === 'PRO' 
                ? 'border-purple-200 bg-purple-50' 
                : tier === 'BASIC'
                ? 'border-blue-200 bg-blue-50'
                : 'border-yellow-200 bg-yellow-50'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Current Plan</h3>
                {tier === 'PRO' && <Star className="h-5 w-5 text-yellow-500" fill="currentColor" />}
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold">
                  {tier === 'PRO' ? 'Pro Member' : tier === 'BASIC' ? 'Basic Member' : 'Free Trial'}
                </p>
                {subscription && (
                  <p className="text-lg text-gray-600">₹{subscription.plan.price}/month</p>
                )}
                {tier === 'FREE_TRIAL' && data?.crewProfile?.trialEnds && (
                  <p className="text-sm text-yellow-700">
                    Trial expires: {formatDate(data.crewProfile.trialEnds)}
                  </p>
                )}
              </div>
            </div>

            {/* Subscription Status */}
            <div className="p-6 rounded-lg border-2 border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold mb-4">Subscription Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status:</span>
                  {subscription ? getStatusBadge(subscription.status) : (
                    <Badge variant="outline">No Subscription</Badge>
                  )}
                </div>
                {hasActiveSubscription && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Billing Cycle:</span>
                      <span className="font-medium">Monthly</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Next Payment:</span>
                      <span className="font-medium">{formatDate(subscription.currentPeriodEnd)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Features */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Your Plan Includes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {subscription.plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Billing Information */}
      {hasActiveSubscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Billing Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Current Billing Period</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                    </p>
                  </div>
                </div>
              </div>
              {subscription.razorpaySubscriptionId && (
                <div className="text-sm text-gray-500">
                  Subscription ID: {subscription.razorpaySubscriptionId}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Subscription</CardTitle>
          <CardDescription>
            Upgrade, downgrade, or cancel your subscription
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tier === 'FREE_TRIAL' && (
              <Button 
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                onClick={() => router.push('/subscription-plans')}
              >
                Upgrade to Premium
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            
            {tier === 'BASIC' && (
              <Button 
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                onClick={() => router.push('/subscription-plans')}
              >
                Upgrade to Pro
                <Star className="ml-2 h-4 w-4" />
              </Button>
            )}

            {tier !== 'FREE_TRIAL' && (
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => router.push('/subscription-plans')}
              >
                View All Plans
              </Button>
            )}

            {hasActiveSubscription && (
              <Button 
                variant="destructive"
                className="w-full"
                onClick={() => setShowCancelDialog(true)}
              >
                Cancel Subscription
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Cancel Subscription
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? You&apos;ll lose access to premium features after your current billing period ends.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> You&apos;ll have a 7-day grace period to reactivate your subscription before losing all premium features.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCancelDialog(false)}
              disabled={actionLoading}
            >
              Keep Subscription
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelSubscription}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Canceling...
                </>
              ) : (
                'Yes, Cancel'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
