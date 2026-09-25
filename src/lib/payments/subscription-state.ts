import type { Requester, SubscriptionRow } from '@/lib/repo'
import type { subscriptionRepo as subscriptionRepoValue } from '@/lib/repo'
import type { ProviderSubscriptionState } from '@/lib/payments/types'

export interface SubscriptionStateRepo {
  upsertByUserId(userId: string, input: Parameters<typeof subscriptionRepoValue.upsertByUserId>[1], requester: Requester): Promise<SubscriptionRow>
}

// The repo default is resolved lazily (dynamic import) so tests can inject a
// fake without dragging the `server-only` Supabase client chain into the
// module graph.
export async function persistProviderSubscription(
  state: ProviderSubscriptionState,
  requester: Requester,
  repo?: SubscriptionStateRepo,
) {
  const effective = repo ?? (await import('@/lib/repo')).subscriptionRepo
  return effective.upsertByUserId(state.userId, {
    planId: state.planId,
    status: state.status,
    currentPeriodStart: state.currentPeriodStart,
    currentPeriodEnd: state.currentPeriodEnd,
    stripeCustomerId: state.stripeCustomerId,
    stripeSubscriptionId: state.stripeSubscriptionId,
    stripePriceId: state.stripePriceId,
    razorpaySubscriptionId: state.razorpaySubscriptionId,
    razorpayPaymentId: state.razorpayPaymentId,
  }, requester)
}
