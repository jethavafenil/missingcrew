/**
 * OAuth State Management - Client Side
 * Handles storing and retrieving role information during OAuth flow
 * This file contains only client-side functions to avoid importing next/headers
 */

export const OAUTH_ROLE_COOKIE = 'oauth_signup_role'
export const OAUTH_INTENT_COOKIE = 'oauth_signup_intent'
const COOKIE_MAX_AGE = 60 * 10 // 10 minutes

/**
 * Store OAuth state (role and intent) in cookies
 * Called from client-side before OAuth redirect
 */
export function setOAuthState(role: string, intent?: string) {
  if (typeof window !== 'undefined') {
    const expires = new Date(Date.now() + COOKIE_MAX_AGE * 1000).toUTCString()
    document.cookie = `${OAUTH_ROLE_COOKIE}=${role}; path=/; expires=${expires}; SameSite=Lax`
    if (intent) {
      document.cookie = `${OAUTH_INTENT_COOKIE}=${intent}; path=/; expires=${expires}; SameSite=Lax`
    }
  }
}

/**
 * Get OAuth state from cookies (client-side)
 */
export function getOAuthStateClient(): { role?: string; intent?: string } {
  if (typeof window === 'undefined') return {}
  
  const cookies = document.cookie.split(';')
  const state: { role?: string; intent?: string } = {}
  
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === OAUTH_ROLE_COOKIE) {
      state.role = value
    } else if (name === OAUTH_INTENT_COOKIE) {
      state.intent = value
    }
  }
  
  return state
}

/**
 * Clear OAuth state cookies (client-side)
 * Called after successful authentication to clean up
 */
export function clearOAuthState() {
  if (typeof window !== 'undefined') {
    // Set cookies with past expiry date to delete them
    document.cookie = `${OAUTH_ROLE_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
    document.cookie = `${OAUTH_INTENT_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
  }
}
