import Stripe from 'stripe'
import { env, requireEnv } from '@/lib/env'
import { getStripe, getOrCreateStripeCustomer } from '@/lib/stripe'
import type { CheckoutInput, CheckoutResult, PaymentProvider } from '@/lib/payments/types'

export class StripePaymentProvider implements PaymentProvider {
  readonly name = 'stripe' as const

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const stripe = getStripe()
    const customer = await getOrCreateStripeCustomer(input.userId, input.email, input.name)
    const session = await stripe.checkout.sessions.create({
      customer,
      mode: 'subscription',
      line_items: [{ price: input.providerPlanId, quantity: 1 }],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: { userId: input.userId, planId: input.planId },
      subscription_data: { metadata: { userId: input.userId, planId: input.planId } },
    })
    return { provider: this.name, checkoutId: session.id, url: session.url }
  }

  async cancelSubscription(subscriptionId: string) {
    await getStripe().subscriptions.cancel(subscriptionId)
  }

  async updateSubscription(subscriptionId: string, providerPlanId: string) {
    const stripe = getStripe()
    const current = await stripe.subscriptions.retrieve(subscriptionId)
    await stripe.subscriptions.update(subscriptionId, {
      items: [{ id: current.items.data[0].id, price: providerPlanId }],
      proration_behavior: 'always_invoice',
    })
  }

  verifyWebhook(rawBody: string, signature: string): Stripe.Event {
    return getStripe().webhooks.constructEvent(rawBody, signature, requireEnv(env.STRIPE_WEBHOOK_SECRET, 'STRIPE_WEBHOOK_SECRET'))
  }
}
