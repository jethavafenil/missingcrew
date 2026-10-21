-- 0015 — Hire requests: a producer asks a crew member to join a project; the crew
-- member accepts or declines. Accepted requests become the source of Verified
-- Production Credits, "current engagement", the hired-projects count and review
-- eligibility (built on top of this table).
--
-- Access is through the server (service role) only, like every other app table
-- (see 0011): no grants for anon/authenticated.

CREATE TABLE IF NOT EXISTS "hire_requests" (
  "id"           text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "employer_id"  text NOT NULL REFERENCES "employer_profiles"("id") ON DELETE CASCADE,
  "crew_id"      text NOT NULL REFERENCES "crew_profiles"("id") ON DELETE CASCADE,
  "project_id"   text NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "role"         text,
  "message"      text NOT NULL,
  "status"       text NOT NULL DEFAULT 'PENDING'
                 CHECK ("status" IN ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED')),
  "created_at"   timestamp(3) NOT NULL DEFAULT now(),
  "responded_at" timestamp(3)
);

-- One request per crew member per project.
CREATE UNIQUE INDEX IF NOT EXISTS "hire_requests_project_crew_key" ON "hire_requests" ("project_id", "crew_id");
CREATE INDEX IF NOT EXISTS "hire_requests_crew_status_idx" ON "hire_requests" ("crew_id", "status");
CREATE INDEX IF NOT EXISTS "hire_requests_employer_idx" ON "hire_requests" ("employer_id", "created_at" DESC);

ALTER TABLE "hire_requests" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "hire_requests" FROM anon, authenticated;
GRANT ALL ON "hire_requests" TO service_role;

-- Notification kinds for the hire flow.
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'HIRE_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'HIRE_RESPONSE';
