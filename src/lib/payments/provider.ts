import { env } from '@/lib/env'
import { RazorpayPaymentProvider } from '@/lib/payments/razorpay'
import { StripePaymentProvider } from '@/lib/payments/stripe'
import type { PaymentProvider, PaymentProviderName } from '@/lib/payments/types'

export function getPaymentProvider(name?: PaymentProviderName): PaymentProvider {
  const selected = name ?? (env.PAYMENT_PROVIDER as PaymentProviderName | undefined) ?? 'stripe'
  if (selected === 'razorpay') return new RazorpayPaymentProvider()
  return new StripePaymentProvider()
}
