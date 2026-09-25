'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth/session-context'

function CompleteProfileContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const role = searchParams.get('role')

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/accounts?tab=signin')
      return
    }

    // Redirect to dashboard
    router.push('/dashboard')
  }, [session, status, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing your profile...</p>
      </div>
    </div>
  )
}

export default function CompleteProfile() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <CompleteProfileContent />
    </Suspense>
  )
}
