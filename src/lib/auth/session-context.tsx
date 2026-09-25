'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { createAuthClient } from '@/lib/auth/client'
import type { AppSession } from '@/lib/auth/types'

type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface SessionContextValue {
  data: AppSession | null
  status: SessionStatus
  refresh: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue>({
  data: null,
  status: 'loading',
  refresh: async () => {},
})

interface SessionProviderProps {
  children: React.ReactNode
  // Session resolved in a server component (validated via getUser()). When
  // provided (even null), the provider starts in a terminal state instead of
  // 'loading', so a reload renders the correct header/role UI immediately.
  initialSession?: AppSession | null
}

export function SessionProvider({ children, initialSession }: SessionProviderProps) {
  const [data, setData] = useState<AppSession | null>(initialSession ?? null)
  const [status, setStatus] = useState<SessionStatus>(
    initialSession === undefined ? 'loading' : initialSession ? 'authenticated' : 'unauthenticated',
  )
  const [hydratedFromServer] = useState(initialSession !== undefined)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session', { cache: 'no-store' })
      if (!res.ok) throw new Error(`session fetch failed: ${res.status}`)
      const session: AppSession | null = await res.json()
      setData(session)
      setStatus(session ? 'authenticated' : 'unauthenticated')
    } catch {
      setData(null)
      setStatus('unauthenticated')
    }
  }, [])

  useEffect(() => {
    // Server already resolved the session; skip the redundant initial fetch
    // (it would also drop an unauthenticated user back into a fetch cycle).
    if (!hydratedFromServer) void refresh()
    const supabase = createAuthClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refresh()
    })
    return () => subscription.unsubscribe()
  }, [refresh, hydratedFromServer])

  return (
    <SessionContext.Provider value={{ data, status, refresh }}>
      {children}
    </SessionContext.Provider>
  )
}

// Drop-in replacement for next-auth's useSession: same { data, status } shape.
export function useSession(): SessionContextValue {
  return useContext(SessionContext)
}

export async function signOut(callbackUrl = '/') {
  const supabase = createAuthClient()
  await supabase.auth.signOut()
  // Full navigation so every server component and the session context re-read
  // cookies.
  window.location.href = callbackUrl
}
