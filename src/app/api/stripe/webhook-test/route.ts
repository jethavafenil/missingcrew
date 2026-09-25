import { env } from '@/lib/env'
import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/api/auth'

export async function GET() {
  await requireRole('ADMIN')
  const hasWebhookSecret = !!env.STRIPE_WEBHOOK_SECRET
  const hasStripeKey = !!env.STRIPE_SECRET_KEY
  
  return NextResponse.json({
    webhookSecretConfigured: hasWebhookSecret,
    stripeKeyConfigured: hasStripeKey,
    environment: env.NODE_ENV || 'development'
  })
}
