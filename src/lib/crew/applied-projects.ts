'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from '@/lib/auth/session-context'

// In-memory cache for the current browser session
let cachedAppliedIds: Set<string> | null = null
let cachedWishlistIds: Set<string> | null = null
let fetchPromise: Promise<void> | null = null
let currentActiveUserId: string | null = null
const listeners = new Set<() => void>()

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener()
    } catch {}
  })
}

function loadFromStorage(userId: string) {
  if (typeof window === 'undefined' || !userId) return
  currentActiveUserId = userId
  try {
    if (cachedAppliedIds === null) {
      const storedApplied = localStorage.getItem(`mc_applied_${userId}`)
      if (storedApplied) {
        const arr = JSON.parse(storedApplied)
        if (Array.isArray(arr)) {
          cachedAppliedIds = new Set(arr)
        }
      }
    }
    if (cachedWishlistIds === null) {
      const storedWishlist = localStorage.getItem(`mc_wishlist_${userId}`)
      if (storedWishlist) {
        const arr = JSON.parse(storedWishlist)
        if (Array.isArray(arr)) {
          cachedWishlistIds = new Set(arr)
        }
      }
    }
  } catch {}
}

function saveToStorage(userId?: string) {
  if (typeof window === 'undefined') return
  const uId = userId || currentActiveUserId
  if (!uId) return
  try {
    if (cachedAppliedIds !== null) {
      localStorage.setItem(`mc_applied_${uId}`, JSON.stringify(Array.from(cachedAppliedIds)))
    }
    if (cachedWishlistIds !== null) {
      localStorage.setItem(`mc_wishlist_${uId}`, JSON.stringify(Array.from(cachedWishlistIds)))
    }
  } catch {}
}

export function isProjectApplied(projectId: string): boolean {
  if (!projectId) return false
  return cachedAppliedIds?.has(projectId) || false
}

export function markProjectAppliedLocally(projectId: string, userId?: string) {
  if (!projectId) return
  if (!cachedAppliedIds) {
    cachedAppliedIds = new Set()
  }
  cachedAppliedIds.add(projectId)
  saveToStorage(userId)
  notifyListeners()
}

export function toggleProjectWishlistLocally(projectId: string, isWishlisted: boolean, userId?: string) {
  if (!projectId) return
  if (!cachedWishlistIds) {
    cachedWishlistIds = new Set()
  }
  if (isWishlisted) {
    cachedWishlistIds.add(projectId)
  } else {
    cachedWishlistIds.delete(projectId)
  }
  saveToStorage(userId)
  notifyListeners()
}

export async function fetchUserProjectStatuses(userId?: string) {
  if (!userId) {
    cachedAppliedIds = new Set()
    cachedWishlistIds = new Set()
    return
  }

  currentActiveUserId = userId
  loadFromStorage(userId)

  if (fetchPromise) {
    return fetchPromise
  }

  fetchPromise = (async () => {
    try {
      const res = await fetch('/api/crew/applied-projects')
      if (res.ok) {
        const data = await res.json()
        cachedAppliedIds = new Set(data.appliedProjectIds || [])
        cachedWishlistIds = new Set(data.wishlistedProjectIds || [])
        saveToStorage(userId)
        notifyListeners()
      }
    } catch (err) {
      console.error('Failed to fetch applied projects status:', err)
    } finally {
      fetchPromise = null
    }
  })()

  return fetchPromise
}

export function useProjectStatus(
  projectId: string,
  initialHasApplied?: boolean,
  initialIsWishlisted?: boolean
) {
  const { data: session } = useSession()
  const userId = session?.user?.id

  // Fast pre-warm from storage if available on client
  if (typeof window !== 'undefined' && userId) {
    loadFromStorage(userId)
  }

  const getAppliedState = useCallback(() => {
    if (initialHasApplied) return true
    if (projectId && cachedAppliedIds !== null) {
      return cachedAppliedIds.has(projectId)
    }
    return initialHasApplied || false
  }, [projectId, initialHasApplied])

  const getWishlistState = useCallback(() => {
    if (initialIsWishlisted !== undefined) return initialIsWishlisted
    if (projectId && cachedWishlistIds !== null) {
      return cachedWishlistIds.has(projectId)
    }
    return false
  }, [projectId, initialIsWishlisted])

  const [hasApplied, setHasApplied] = useState<boolean>(getAppliedState)
  const [isWishlisted, setIsWishlisted] = useState<boolean>(getWishlistState)

  useEffect(() => {
    setHasApplied(getAppliedState())
    setIsWishlisted(getWishlistState())
  }, [getAppliedState, getWishlistState])

  useEffect(() => {
    if (!userId) return

    const listener = () => {
      setHasApplied(getAppliedState())
      setIsWishlisted(getWishlistState())
    }

    listeners.add(listener)

    // Ensure status is loaded in batch once and synced
    void fetchUserProjectStatuses(userId)

    return () => {
      listeners.delete(listener)
    }
  }, [userId, getAppliedState, getWishlistState])

  return {
    hasApplied,
    isWishlisted,
    setHasApplied: (val: boolean) => {
      setHasApplied(val)
      if (val && projectId) markProjectAppliedLocally(projectId, userId)
    },
    setIsWishlisted: (val: boolean) => {
      setIsWishlisted(val)
      if (projectId) toggleProjectWishlistLocally(projectId, val, userId)
    },
  }
}
