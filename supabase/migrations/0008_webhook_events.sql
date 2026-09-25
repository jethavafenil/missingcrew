-- 0008 — Webhook event idempotency.
--
-- Payment providers retry webhooks and can deliver the same event more than
-- once. The (provider, event_id) unique constraint lets handlers claim an
-- event exactly once: INSERT ... ON CONFLICT DO NOTHING returns no row when
-- the event was already processed, so the handler can skip duplicates.
-- Razorpay payloads carry no event id, so its handler stores the SHA-256 of
-- the raw body as event_id.
--
-- Rows are written by the service client only (webhook routes); RLS is
-- enabled with no policies so no client role can read or write them.

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event_id text NOT NULL,
  event_type text,
  received_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, event_id)
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
