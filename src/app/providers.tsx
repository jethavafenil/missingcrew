'use client'

import { SessionProvider } from '@/lib/auth/session-context'
import type { AppSession } from '@/lib/auth/types'
import ToastProvider from '@/components/ui/ToastProvider'

export default function Providers({
  children,
  initialSession,
}: {
  children: React.ReactNode
  initialSession?: AppSession | null
}) {
  return (
    <SessionProvider initialSession={initialSession}>
      <ToastProvider>
        {children}
      </ToastProvider>
    </SessionProvider>
  )
}
