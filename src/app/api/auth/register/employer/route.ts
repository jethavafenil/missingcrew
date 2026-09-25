import { NextResponse, type NextRequest } from 'next/server'
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimiter'
import { z } from 'zod'
import { parseBody } from '@/lib/api/body'
import { getAdminAuthClient } from '@/lib/auth/admin'
import { userRepo, employerProfileRepo, SYSTEM_REQUESTER } from '@/lib/repo'

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
    const { companyName, contactName, email, password } = await parseBody(request, z.object({
      companyName: z.string().trim().min(1).max(150),
      contactName: z.string().trim().min(1).max(100),
      email: z.email().max(254),
      password: z.string().min(8).max(128),
    }))

    const { data, error } = await getAdminAuthClient().createUser({
      email,
      password,
      email_confirm: false,
      // user_metadata is present at INSERT time so the provisioning trigger
      // can read the role (GoTrue applies app_metadata only afterwards).
      user_metadata: { name: contactName, role: 'EMPLOYER' },
      app_metadata: { role: 'EMPLOYER' },
    })

    if (error) {
      const alreadyExists =
        error.message.toLowerCase().includes('already') || error.status === 422
      return NextResponse.json(
        { error: alreadyExists ? 'User with this email already exists' : 'Failed to create account. Please try again.' },
        { status: alreadyExists ? 409 : 500 },
      )
    }

    const dbUser = await userRepo.findByEmail(email, SYSTEM_REQUESTER)
    if (dbUser) {
      await employerProfileRepo.updateByUserId(dbUser.id, { companyName }, SYSTEM_REQUESTER)
    }

    return NextResponse.json(
      {
        success: true,
        message: 'User created successfully. Please check your email for verification.',
        user: { id: data.user?.id, email, role: 'EMPLOYER' },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Employer registration error:', error)
    return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 })
  }
}
