'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createAuthClient } from '@/lib/auth/client'
import type { AppSession } from '@/lib/auth/types'

type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface SessionContextValue {
  data: AppSession | null
  status: SessionStatus
  refresh: () => Promise<void>
}

// Set while this tab is deliberately signing out, so the identity-change reload
// below doesn't race the sign-out navigation.
let signingOut = false

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
  // Identity this tab last rendered for. Auth cookies are shared by every tab
  // of a browser profile, so signing in/out as someone else in another tab
  // leaves this tab showing (and acting as) the wrong user until it re-checks.
  const renderedUserId = useRef<string | null>(initialSession?.user?.id ?? null)
  const lastCheck = useRef(0)

  const refresh = useCallback(async () => {
    lastCheck.current = Date.now()
    try {
      const res = await fetch('/api/auth/session', { cache: 'no-store' })
      if (!res.ok) throw new Error(`session fetch failed: ${res.status}`)
      const session: AppSession | null = await res.json()
      const nextUserId = session?.user?.id ?? null
      if (renderedUserId.current !== nextUserId && (renderedUserId.current !== null || nextUserId !== null)) {
        const hadUser = renderedUserId.current !== null
        renderedUserId.current = nextUserId
        // The identity changed underneath this tab (other tab logged in as a
        // different user, or logged out): reload so server-rendered content
        // and cached client state are rebuilt for the current user.
        if (hadUser && !signingOut) {
          window.location.reload()
          return
        }
      }
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
    // Re-validate when the tab becomes visible again (throttled), so a switch
    // between tabs picks up a login/logout done in another tab.
    const recheck = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastCheck.current > 3000) void refresh()
    }
    document.addEventListener('visibilitychange', recheck)
    window.addEventListener('focus', recheck)
    return () => {
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', recheck)
      window.removeEventListener('focus', recheck)
    }
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
  signingOut = true
  const supabase = createAuthClient()
  await supabase.auth.signOut()
  // Full navigation so every server component and the session context re-read
  // cookies.
  window.location.href = callbackUrl
}
