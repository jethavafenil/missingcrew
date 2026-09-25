import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/server'
import { setUserRole } from '@/lib/auth/admin'
import {
  userRepo,
  crewProfileRepo,
  employerProfileRepo,
  SYSTEM_REQUESTER,
  type UserRole,
} from '@/lib/repo'
import { OAUTH_ROLE_COOKIE, OAUTH_INTENT_COOKIE } from '@/lib/oauthState'

// GoTrue redirect target for Google OAuth callbacks and email-confirmation
// links (PKCE ?code=..., or ?token_hash=...&type=... for email links).
// Sets the session cookies, then corrects the signup role for brand-new
// OAuth users from the oauth_signup_role cookie (replaces the old
// globalThis.__oauth_signup_role NextAuth hack).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const linkType = searchParams.get('type')
  const oauthRole = parseRole(request.cookies.get(OAUTH_ROLE_COOKIE)?.value)
  const intent = request.cookies.get(OAUTH_INTENT_COOKIE)?.value

  const redirectWithError = (path: string) =>
    clearStateCookies(NextResponse.redirect(`${origin}${path}`))

  const supabase = await getSupabaseServerClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) return redirectWithError('/accounts?tab=signin&error=OAuthCallbackError')
  } else if (tokenHash && linkType) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: linkType as never })
    if (error) return redirectWithError('/accounts?tab=signin&error=OAuthCallbackError')
    if (linkType.startsWith('signup') || linkType === 'email_change') {
      return redirectWithEmailVerified(origin, request)
    }
  } else {
    return redirectWithError('/accounts?tab=signin&error=OAuthCallbackError')
  }

  const session = await getSession()
  if (!session?.user) return redirectWithError('/accounts?tab=signin&error=OAuthCallbackError')

  // Role fixup applies only to accounts created moments ago (this OAuth
  // sign-in was a signup). Existing users keep their role regardless of the
  // cookie, matching the old NextAuth behavior.
  const isNewAccount =
    Date.now() - new Date(session.user.createdAt).getTime() < 5 * 60_000
  if (oauthRole && isNewAccount && session.user.role !== oauthRole) {
    await setUserRole(session.user.authId, oauthRole)
    await userRepo.updateUser(session.user.id, { role: oauthRole }, SYSTEM_REQUESTER)
    if (oauthRole === 'EMPLOYER') {
      await crewProfileRepo.deleteByUserId(session.user.id, SYSTEM_REQUESTER)
      await employerProfileRepo.upsertByUserId(
        session.user.id,
        { companyName: session.user.name || 'My Company', completed: false },
        SYSTEM_REQUESTER,
      )
    } else {
      await employerProfileRepo.deleteByUserId(session.user.id, SYSTEM_REQUESTER)
      await crewProfileRepo.create(
        {
          userId: session.user.id,
          primaryRoles: [],
          projectTypes: [],
          languages: [],
          portfolioLinks: [],
        },
        SYSTEM_REQUESTER,
      )
    }
  }

  const redirectPath =
    intent === 'post-requirement' && session.user.role === 'EMPLOYER'
      ? '/employer/post-requirement'
      : session.user.role === 'ADMIN'
        ? '/admin'
        : session.user.role === 'EMPLOYER'
          ? '/employer-home'
          : '/crew-home'

  return clearStateCookies(NextResponse.redirect(`${origin}${redirectPath}`))
}

function redirectWithEmailVerified(origin: string, request: NextRequest) {
  const role = parseRole(request.cookies.get(OAUTH_ROLE_COOKIE)?.value)
  const target = new URL('/accounts', origin)
  target.searchParams.set('tab', 'signin')
  target.searchParams.set('message', 'EmailVerifiedSuccessfully')
  if (role) target.searchParams.set('role', role.toLowerCase())
  return clearStateCookies(NextResponse.redirect(target.toString()))
}

function parseRole(value: string | undefined): UserRole | null {
  if (value === 'EMPLOYER' || value === 'CREW') return value
  return null
}

function clearStateCookies(response: NextResponse) {
  response.cookies.delete(OAUTH_ROLE_COOKIE)
  response.cookies.delete(OAUTH_INTENT_COOKIE)
  return response
}
