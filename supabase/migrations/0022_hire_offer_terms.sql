-- Offer terms the producer fills in when hiring (fee, schedule, responsibilities, ...).
-- Stored as JSON on the hire request, shown to the crew member before they accept, and copied
-- into the agreement when they do. Empty for requests sent before this existed.
ALTER TABLE "hire_requests" ADD COLUMN IF NOT EXISTS "offer" jsonb;
