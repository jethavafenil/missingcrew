-- 0018 — Site settings (admin-controlled switches). First one: whether trials/paid plans are
-- on. Until an admin turns it on, everything is free: no trial, no pricing, unlimited applying.
--
-- Access is through the server (service role) only, like every other app table (0011).

CREATE TABLE IF NOT EXISTS "site_settings" (
  "key"        text PRIMARY KEY,
  "value"      jsonb NOT NULL,
  "updated_at" timestamp(3) NOT NULL DEFAULT now()
);

INSERT INTO "site_settings" ("key", "value")
VALUES ('plans', '{"paidPlansEnabled": false}'::jsonb)
ON CONFLICT ("key") DO NOTHING;

ALTER TABLE "site_settings" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "site_settings" FROM anon, authenticated;
GRANT ALL ON "site_settings" TO service_role;
