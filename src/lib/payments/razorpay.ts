import { createHmac, timingSafeEqual } from 'node:crypto'
import { env, requireEnv } from '@/lib/env'
import { getRazorpay } from '@/lib/razorpay'
import type { CheckoutInput, CheckoutResult, PaymentProvider } from '@/lib/payments/types'

export class RazorpayPaymentProvider implements PaymentProvider {
  readonly name = 'razorpay' as const

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const client = getRazorpay()
    if (!client) throw new Error('Razorpay is not configured')
    const subscription = await client.subscriptions.create({
      plan_id: input.providerPlanId,
      total_count: 12,
      customer_notify: 1,
      notes: { userId: input.userId, planId: input.planId },
    })
    return {
      provider: this.name,
      checkoutId: subscription.id,
      publicKey: requireEnv(env.RAZORPAY_KEY_ID, 'RAZORPAY_KEY_ID'),
      raw: subscription,
    }
  }

  async cancelSubscription(subscriptionId: string) {
    const client = getRazorpay()
    if (!client) throw new Error('Razorpay is not configured')
    await client.subscriptions.cancel(subscriptionId)
  }

  verifyWebhook(rawBody: string, signature: string): unknown {
    const secret = requireEnv(env.RAZORPAY_WEBHOOK_SECRET, 'RAZORPAY_WEBHOOK_SECRET')
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
    const actualBuffer = Buffer.from(signature)
    const expectedBuffer = Buffer.from(expected)
    if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) throw new Error('Invalid Razorpay signature')
    return JSON.parse(rawBody)
  }
}
