import { env } from '@/lib/env'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimiter'
import { setOTP } from '@/lib/otpStore'
import { z } from 'zod'
import { parseBody } from '@/lib/api/body'

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function isE164(phone: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(phone)
}

async function sendSmsTwilio(to: string, body: string) {
  const sid = env.TWILIO_ACCOUNT_SID
  const token = env.TWILIO_AUTH_TOKEN
  const from = env.TWILIO_FROM_NUMBER
  if (!sid || !token || !from) {
    throw new Error('Twilio credentials are not configured')
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`
  const form = new URLSearchParams()
  form.append('From', from)
  form.append('To', to)
  form.append('Body', body)

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Twilio SMS failed: ${res.status} ${text}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }
    const limited = await rateLimitMiddleware(request, 'otp-send', { userId: session.user.id, policy: RATE_LIMITS.otpSend })
    if (limited) return limited

    const { phoneNumber } = await parseBody(request, z.object({ phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/) }))

    if (!isE164(phoneNumber)) {
      return NextResponse.json({ success: false, message: 'Enter phone in E.164 format, e.g. +14155552671' }, { status: 400 })
    }

    const code = generateCode()
    // Store code for 5 minutes (Redis or in-memory fallback)
    await setOTP(session.user.id, phoneNumber, code, 300)

    const smsBody = `Your MissingCrew verification code is ${code}. It expires in 5 minutes.`

    const devMock = env.NODE_ENV === 'development' && (env.MOCK_SMS === '1' || (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM_NUMBER))

    if (devMock) {
      return NextResponse.json({ success: true, message: 'Verification code generated (development mode).', devCode: code })
    }

    await sendSmsTwilio(phoneNumber, smsBody)

    return NextResponse.json({ success: true, message: 'Verification code sent' })
  } catch (err: any) {
    console.error('OTP send error:', err)
    return NextResponse.json({ success: false, message: err?.message || 'Failed to send code' }, { status: 500 })
  }
}
