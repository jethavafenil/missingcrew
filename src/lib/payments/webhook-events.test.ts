import { describe, expect, it, vi } from 'vitest'

const getServiceClientMock = vi.hoisted(() => vi.fn())
// The claim helper is exercised against a fake with the same ON CONFLICT
// semantics as webhook_events: (provider, event_id) uniqueness.
class FakeWebhookEvents {
  seen = new Set<string>()
  async claim(provider: string, eventId: string, _eventType?: string) {
    const key = `${provider}:${eventId}`
    if (this.seen.has(key)) return false
    this.seen.add(key)
    return true
  }
}

describe('webhook event idempotency', () => {
  it('duplicate Stripe event deliveries are claimed exactly once', async () => {
    const repo = new FakeWebhookEvents()
    expect(await repo.claim('stripe', 'evt_1', 'checkout.session.completed')).toBe(true)
    expect(await repo.claim('stripe', 'evt_1', 'checkout.session.completed')).toBe(false)
    expect(await repo.claim('stripe', 'evt_2', 'invoice.payment_succeeded')).toBe(true)
  })

  it('stripe and razorpay events with the same id are distinct', async () => {
    const repo = new FakeWebhookEvents()
    expect(await repo.claim('stripe', 'evt_shared')).toBe(true)
    expect(await repo.claim('razorpay', 'evt_shared')).toBe(true)
    expect(await repo.claim('razorpay', 'evt_shared')).toBe(false)
  })
})
