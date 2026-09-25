'use client'

import { Suspense } from 'react'
import { SubscriptionManagement } from '@/components/subscription/SubscriptionManagement'
import { RefreshCw } from 'lucide-react'

function SubscriptionManagementContent() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <SubscriptionManagement />
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex flex-col items-center justify-center py-12">
        <RefreshCw className="h-12 w-12 animate-spin text-indigo-600 mb-4" />
        <p className="text-gray-600">Loading subscription management...</p>
      </div>
    </div>
  )
}

export default function SubscriptionManagementPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SubscriptionManagementContent />
    </Suspense>
  )
}
