import { env } from '@/lib/env'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { getOTP, delOTP } from '@/lib/otpStore'
import { userRepo, requesterFromSession } from '@/lib/repo'
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimiter'
import { z } from 'zod'
import { parseBody } from '@/lib/api/body'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }
    const limited = await rateLimitMiddleware(request, 'otp-verify', { userId: session.user.id, policy: RATE_LIMITS.otpVerify })
    if (limited) return limited

    const { phoneNumber, code } = await parseBody(request, z.object({
      phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/),
      code: z.string().regex(/^\d{6}$/),
    }))

    const devMaster = env.NODE_ENV === 'development' && env.MOCK_SMS === '1' && code === (env.MOCK_SMS_MASTER_CODE || '000000')

    let expected = await getOTP(session.user.id, phoneNumber)

    if (!expected && !devMaster) {
      return NextResponse.json({ success: false, message: 'Code expired or not found' }, { status: 400 })
    }

    if (!devMaster && expected !== code) {
      return NextResponse.json({ success: false, message: 'Invalid verification code' }, { status: 400 })
    }

    // Consume OTP if present
    if (expected) {
      await delOTP(session.user.id, phoneNumber)
    }

    // Persist verification on user
    await userRepo.updateUser(session.user.id, { phone: phoneNumber, phoneVerified: true }, requesterFromSession(session))

    return NextResponse.json({ success: true, message: 'Phone verified' })
  } catch (err: any) {
    console.error('OTP verify error:', err)
    return NextResponse.json({ success: false, message: err?.message || 'Failed to verify code' }, { status: 500 })
  }
}
