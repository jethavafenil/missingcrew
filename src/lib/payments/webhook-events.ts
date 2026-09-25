import { getServiceClient } from '@/lib/repo/client'
import { throwOnError } from '@/lib/repo/helpers'
import type { PaymentProviderName } from '@/lib/payments/types'

export interface WebhookEventClaimer {
  claim(provider: PaymentProviderName, eventId: string, eventType?: string): Promise<boolean>
}

// Returns true when this call is the first to see the event (the handler
// should process it), false when the event was already processed (duplicate
// delivery — the handler should return success without reprocessing).
async function claim(provider: PaymentProviderName, eventId: string, eventType?: string): Promise<boolean> {
  // ignoreDuplicates turns this into INSERT ... ON CONFLICT (provider, event_id)
  // DO NOTHING, so a duplicate delivery inserts no row and selects nothing.
  const { data, error } = await getServiceClient()
    .from('webhook_events')
    .upsert({ provider, event_id: eventId, event_type: eventType ?? null }, { onConflict: 'provider,event_id', ignoreDuplicates: true })
    .select('id')
    .maybeSingle()
  throwOnError('webhookEvents.claim', error)
  return Boolean(data)
}

export const webhookEventsRepo: WebhookEventClaimer = { claim }
