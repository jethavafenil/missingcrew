import { describe, expect, it, vi } from 'vitest'
import { persistProviderSubscription, type SubscriptionStateRepo } from './subscription-state.ts'
import type { SubscriptionRow } from '../repo'

// The real repo drags the `server-only` Supabase client chain into the module
// graph; a fake with the same upsert semantics keeps this a pure unit test.
const getServiceClientMock = vi.hoisted(() => vi.fn())
vi.mock('@/lib/repo/client', () => ({ getServiceClient: getServiceClientMock }))

describe('persistProviderSubscription (checkout state)', () => {
  it('creates then updates one subscription row without mixing provider columns', async () => {
    const rows = new Map<string, SubscriptionRow>()
    const repo: SubscriptionStateRepo = {
      async upsertByUserId(userId, input) {
        const previous = rows.get(userId)
        const row = {
          id: previous?.id ?? 'sub-1', userId, planId: input.planId,
          status: input.status ?? 'ACTIVE',
          razorpaySubscriptionId: input.razorpaySubscriptionId ?? previous?.razorpaySubscriptionId ?? null,
          razorpayPaymentId: input.razorpayPaymentId ?? previous?.razorpayPaymentId ?? null,
          stripeCustomerId: input.stripeCustomerId ?? previous?.stripeCustomerId ?? null,
          stripeSubscriptionId: input.stripeSubscriptionId ?? previous?.stripeSubscriptionId ?? null,
          stripePriceId: input.stripePriceId ?? previous?.stripePriceId ?? null,
          currentPeriodStart: new Date(input.currentPeriodStart), currentPeriodEnd: new Date(input.currentPeriodEnd),
          createdAt: previous?.createdAt ?? new Date(0), updatedAt: new Date(),
        } satisfies SubscriptionRow
        rows.set(userId, row)
        return row
      },
    }
    const requester = { userId: 'user-1', role: 'CREW' as const }
    await persistProviderSubscription({
      userId: 'user-1', planId: 'basic', status: 'ACTIVE', stripeCustomerId: 'cus_1',
      stripeSubscriptionId: 'sub_stripe_1', stripePriceId: 'price_1',
      currentPeriodStart: new Date(0), currentPeriodEnd: new Date(1000),
    }, requester, repo)
    const updated = await persistProviderSubscription({
      userId: 'user-1', planId: 'pro', status: 'ACTIVE', stripeCustomerId: 'cus_1',
      stripeSubscriptionId: 'sub_stripe_1', stripePriceId: 'price_2',
      currentPeriodStart: new Date(1000), currentPeriodEnd: new Date(2000),
    }, requester, repo)
    expect(rows.size).toBe(1)
    expect(updated.planId).toBe('pro')
    expect(updated.stripePriceId).toBe('price_2')
    expect(updated.razorpaySubscriptionId).toBeNull()
  })
})
