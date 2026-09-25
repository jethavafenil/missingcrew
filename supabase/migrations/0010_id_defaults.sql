-- 0010 — DB-side id defaults for all app tables.
--
-- Prisma generated cuid() ids client-side; the Supabase repo layer's create
-- functions never supply an id, and no column had a default — so every
-- app-level insert failed with 'null value in column "id" violates not-null
-- constraint'. (Signups worked only because handle_new_auth_user generates
-- ids itself with gen_random_uuid().)
--
-- gen_random_uuid()::text matches the trigger's id format and keeps TEXT pks
-- (existing cuid-format ids are unaffected). pgcrypto's gen_random_uuid is
-- built into Postgres 13+.

ALTER TABLE "users"          ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "crew_profiles"  ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "employer_profiles" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "projects"       ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "applications"   ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "connections"    ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "wishlists"      ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "notifications"  ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "subscriptions"  ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "subscription_plans" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
