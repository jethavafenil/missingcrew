import { NextRequest, NextResponse } from 'next/server'
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimiter'
import { z } from 'zod'
import { parseBody } from '@/lib/api/body'
import { getAdminAuthClient } from '@/lib/auth/admin'

// Creates the GoTrue user; the on_auth_user_created trigger (migration 0001)
// provisions the public.users row + placeholder crew profile, reading the
// role from app_metadata. GoTrue sends the confirmation email.
export async function POST(request: NextRequest) {
  const rateLimitResponse = await rateLimitMiddleware(request, 'auth-register-crew', { policy: RATE_LIMITS.authRegister })
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const { name, email, password } = await parseBody(request, z.object({
      name: z.string().trim().min(1).max(100),
      email: z.email().max(254),
      password: z.string().min(8).max(128),
    }))

    const { data, error } = await getAdminAuthClient().createUser({
      email,
      password,
      email_confirm: false,
      // user_metadata is present at INSERT time so the provisioning trigger
      // can read the role (GoTrue applies app_metadata only afterwards).
      user_metadata: { name, role: 'CREW' },
      app_metadata: { role: 'CREW' },
    })

    if (error) {
      const alreadyExists =
        error.message.toLowerCase().includes('already') || error.status === 422
      return NextResponse.json(
        { error: alreadyExists ? 'User with this email already exists' : 'Failed to create account. Please try again.' },
        { status: alreadyExists ? 409 : 500 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'User created successfully. Please check your email for verification.',
        userId: data.user?.id,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Crew registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
