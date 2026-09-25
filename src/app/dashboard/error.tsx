'use client'

import { RouteError } from '@/components/route/RouteError'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError error={error} reset={reset} title="Unable to load your dashboard" />
}
