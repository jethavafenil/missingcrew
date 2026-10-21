'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createAuthClient } from '@/lib/auth/client'
import type { AppSession } from '@/lib/auth/types'
import { isSignInVerifying } from '@/lib/auth/auth-flags'

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
  // When this tab itself last signed in/out. An identity change right after that is our own doing, not another tab's.
  const lastOwnAuthEvent = useRef(0)

  // `reloadOnChange` is only set by the focus/visibility re-check: an identity change seen then was
  // made in ANOTHER tab. Auth events from this tab (sign-in, sign-out, wrong-role check) never reload.
  const refresh = useCallback(async (reloadOnChange = false) => {
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
        const ownRecently = Date.now() - lastOwnAuthEvent.current < 10_000
        if (reloadOnChange && hadUser && !signingOut && !ownRecently && !isSignInVerifying()) {
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
      lastOwnAuthEvent.current = Date.now()
      void refresh(false)
    })
    // Re-validate when the tab becomes visible again (throttled), so a switch
    // between tabs picks up a login/logout done in another tab.
    const recheck = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastCheck.current > 3000) void refresh(true)
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
