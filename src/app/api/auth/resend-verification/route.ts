import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { parseBody } from '@/lib/api/body'
import { ApiError } from '@/lib/api/errors'
import { isEmailVerificationRequired, sendSignupConfirmation } from '@/lib/auth/admin'
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimiter'

// Re-sends the signup confirmation email. The response is identical whether or
// not the address exists / is already confirmed, so it can't be used to probe
// for accounts. Strictly rate limited (it triggers outbound email).
export async function POST(request: NextRequest) {
  const limited = await rateLimitMiddleware(request, 'auth-resend-verification', { policy: RATE_LIMITS.authRegister })
  if (limited) return limited

  try {
    const { email } = await parseBody(request, z.object({ email: z.email().max(254) }))

    if (isEmailVerificationRequired()) {
      try {
        await sendSignupConfirmation(email, `${new URL(request.url).origin}/auth/callback`)
      } catch (error) {
        console.error('Resend verification failed:', error)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'If that address has an unverified account, a new verification email is on its way.',
    })
  } catch (error) {
    if (error instanceof ApiError && error.status < 500) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Resend verification error:', error)
    return NextResponse.json({ error: 'Failed to send email. Please try again.' }, { status: 500 })
  }
}
