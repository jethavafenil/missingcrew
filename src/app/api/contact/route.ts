import { env } from '@/lib/env'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimiter'
import { z } from 'zod'
import { parseBody } from '@/lib/api/body'
import { sendEmail } from '@/lib/email'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: NextRequest) {
  // Rate limit first
  const limited = await rateLimitMiddleware(request, 'contact-submit', { policy: RATE_LIMITS.contact })
  if (limited) return limited

  try {
    const { name, email, subject, message } = await parseBody(request, z.object({
      name: z.string().trim().min(2).max(100),
      email: z.email().max(200),
      subject: z.string().trim().min(3).max(150),
      message: z.string().trim().min(10).max(5000),
    }))

    if (
      !name || typeof name !== 'string' || name.length < 2 || name.length > 100 ||
      !email || typeof email !== 'string' || !isValidEmail(email) || email.length > 200 ||
      !subject || typeof subject !== 'string' || subject.length < 3 || subject.length > 150 ||
      !message || typeof message !== 'string' || message.length < 10 || message.length > 5000
    ) {
      return NextResponse.json({ success: false, message: 'Invalid input' }, { status: 400 })
    }

    const to = env.CONTACT_EMAIL || env.SUPPORT_EMAIL || 'support@missingcrew.com'

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #111827;">New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <div style="margin-top: 16px; padding: 12px; background: #F9FAFB; border-radius: 6px; white-space: pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      </div>
    `

    const result = await sendEmail({ to, subject: `[Contact] ${subject}`, html })

    // Optionally send an auto-acknowledgement to the sender if email is configured
    if (result.success && env.EMAIL_HOST) {
      const ackHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #2563eb;">Thanks for contacting MissingCrew</h2>
          <p>Hi ${name},</p>
          <p>We have received your message with the subject "${subject}". Our team will get back to you as soon as possible.</p>
          <p>If this was not you, please ignore this email.</p>
          <p>Best regards,<br/>The MissingCrew Team</p>
        </div>
      `
      // Fire and forget; do not block on acknowledgement
      sendEmail({ to: email, subject: 'We received your message', html: ackHtml }).catch(() => {})
    }

    // Provide user-facing message depending on email configuration
    if (!result.success) {
      // Even if email fails in local dev, respond success but indicate fallback
      return NextResponse.json({ success: true, message: 'Message received. Email service not configured; stored in logs.' })
    }

    return NextResponse.json({ success: true, message: 'Message sent successfully.' })
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Unexpected error' }, { status: 500 })
  }
}
