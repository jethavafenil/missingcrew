import type { SubscriptionStatus } from '@/lib/repo'

export type PaymentProviderName = 'stripe' | 'razorpay'

export interface CheckoutInput {
  userId: string
  email: string
  name?: string
  planId: string
  providerPlanId: string
  successUrl: string
  cancelUrl: string
}

export interface CheckoutResult {
  provider: PaymentProviderName
  checkoutId: string
  url?: string | null
  publicKey?: string
  raw?: unknown
}

export interface PaymentProvider {
  readonly name: PaymentProviderName
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>
  cancelSubscription(subscriptionId: string): Promise<void>
  updateSubscription?(subscriptionId: string, providerPlanId: string): Promise<void>
  verifyWebhook(rawBody: string, signature: string): unknown
}

export interface ProviderSubscriptionState {
  userId: string
  planId: string
  status: SubscriptionStatus
  currentPeriodStart: Date
  currentPeriodEnd: Date
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
  stripePriceId?: string | null
  razorpaySubscriptionId?: string | null
  razorpayPaymentId?: string | null
}
