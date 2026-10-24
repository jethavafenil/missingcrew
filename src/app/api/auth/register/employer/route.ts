import { NextResponse, type NextRequest } from 'next/server'
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimiter'
import { z } from 'zod'
import { parseBody } from '@/lib/api/body'
import { ApiError } from '@/lib/api/errors'
import { containsLetter } from '@/lib/utils'
import { getAdminAuthClient, isEmailVerificationRequired, sendSignupConfirmation } from '@/lib/auth/admin'
import { isStrongPassword, PASSWORD_MAX_LENGTH, PASSWORD_POLICY_MESSAGE } from '@/lib/auth/password'
import { userRepo, employerProfileRepo, SYSTEM_REQUESTER } from '@/lib/repo'
import { isValidPhone, normalizePhone, PHONE_MESSAGE } from '@/lib/phone'

// Creates the GoTrue user; the on_auth_user_created trigger (migration 0001)
// provisions the public.users row + placeholder employer profile, reading the
// role from app_metadata. The company name from the form replaces the
// placeholder value afterwards.
export async function POST(request: NextRequest) {
  const rateLimitResponse = await rateLimitMiddleware(request, 'auth-register-employer', { policy: RATE_LIMITS.authRegister })
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const { companyName, contactName, phone, email, password } = await parseBody(request, z.object({
      companyName: z.string().trim().min(1).max(150),
      contactName: z.string().trim().min(1).max(100).refine(containsLetter, 'Contact name must contain letters, not just numbers'),
      phone: z.string().trim().max(30).refine(isValidPhone, PHONE_MESSAGE),
      email: z.email().max(254),
      password: z.string().max(PASSWORD_MAX_LENGTH).refine(isStrongPassword, PASSWORD_POLICY_MESSAGE),
    }))

    const verificationRequired = isEmailVerificationRequired()

    const { data, error } = await getAdminAuthClient().createUser({
      email,
      password,
      // With REQUIRE_EMAIL_VERIFICATION the account starts unconfirmed and the
      // user must click the emailed link before signing in.
      email_confirm: !verificationRequired,
      // user_metadata is present at INSERT time so the provisioning trigger
      // can read the role (GoTrue applies app_metadata only afterwards).
      user_metadata: { name: contactName, role: 'EMPLOYER' },
      app_metadata: { role: 'EMPLOYER' },
    })

    if (error) {
      console.error('Employer registration Supabase error:', { message: error.message, status: error.status, code: (error as any).code })
      const alreadyExists =
        error.message.toLowerCase().includes('already') || error.status === 422
      return NextResponse.json(
        { error: alreadyExists ? 'An account with this email already exists. Please sign in, or use a different email address.' : 'Failed to create account. Please try again.' },
        { status: alreadyExists ? 409 : 500 },
      )
    }

    const dbUser = await userRepo.findByEmail(email, SYSTEM_REQUESTER)
    if (dbUser) {
      await employerProfileRepo.updateByUserId(dbUser.id, { companyName }, SYSTEM_REQUESTER)
      await userRepo.updateUser(dbUser.id, { phone: normalizePhone(phone) }, SYSTEM_REQUESTER)
    }

    if (verificationRequired) {
      try {
        await sendSignupConfirmation(email, `${new URL(request.url).origin}/auth/callback`)
      } catch (mailError) {
        // Account exists; the user can request another link from the sign-in page.
        console.error('Employer signup confirmation email failed:', mailError)
      }
    }

    return NextResponse.json(
      {
        success: true,
        verificationRequired,
        message: verificationRequired
          ? 'Account created. Please check your email to verify your address.'
          : 'User created successfully.',
        user: { id: data.user?.id, email, role: 'EMPLOYER' },
      },
      { status: 201 },
    )
  } catch (error) {
    // Validation failures (weak password, bad name/email) carry a user-facing message.
    if (error instanceof ApiError && error.status < 500) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }
    console.error('Employer registration error:', error)
    return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 })
  }
}
