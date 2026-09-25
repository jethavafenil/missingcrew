'use client'

import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RouteErrorProps {
  error: Error & { digest?: string }
  reset: () => void
  title?: string
}

export function RouteError({ error, reset, title = 'Something went wrong' }: RouteErrorProps) {
  useEffect(() => {
    console.error(title, { message: error.message, digest: error.digest })
  }, [error, title])

  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-lg">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-600" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="mt-2 text-gray-600">We could not load this page. Please try again.</p>
        <Button className="mt-6" onClick={reset}>Try again</Button>
      </div>
    </main>
  )
}
