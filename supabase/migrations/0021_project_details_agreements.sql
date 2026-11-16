-- 0021 — Project ID, shoot duration, project status; agreement record for accepted hires;
-- crew phone numbers kept as 10 digits.
--
-- Everything is additive. Existing projects get a project ID (MC-000001 ...) in the order they
-- were created; new ones get the next number automatically from a sequence, so IDs are unique
-- even when two producers post at the same moment.

-- ---------------------------------------------------------------------------------------------
-- 1. Unique project ID
-- ---------------------------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS "project_code_seq" START WITH 1 INCREMENT BY 1;

ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "project_code" text;

WITH ordered AS (
  SELECT "id", row_number() OVER (ORDER BY "created_at", "id") AS rn
  FROM "projects"
  WHERE "project_code" IS NULL
)
UPDATE "projects" p
SET "project_code" = 'MC-' || lpad((
  COALESCE((SELECT max(substring(q."project_code" from 4)::int) FROM "projects" q WHERE q."project_code" ~ '^MC-[0-9]+$'), 0) + o.rn
)::text, 6, '0')
FROM ordered o
WHERE p."id" = o."id";

SELECT setval(
  'project_code_seq',
  COALESCE((SELECT max(substring("project_code" from 4)::int) FROM "projects" WHERE "project_code" ~ '^MC-[0-9]+$'), 0) + 1,
  false
);

ALTER TABLE "projects" ALTER COLUMN "project_code" SET DEFAULT ('MC-' || lpad(nextval('project_code_seq')::text, 6, '0'));
ALTER TABLE "projects" ALTER COLUMN "project_code" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "projects_project_code_key" ON "projects" ("project_code");
GRANT USAGE, SELECT ON SEQUENCE "project_code_seq" TO service_role;

-- ---------------------------------------------------------------------------------------------
-- 2. Shoot duration and project status (both optional)
-- ---------------------------------------------------------------------------------------------
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "shoot_duration" text;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "shoot_duration_custom" text;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "production_status" text;

ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_shoot_duration_check";
ALTER TABLE "projects" ADD CONSTRAINT "projects_shoot_duration_check"
  CHECK ("shoot_duration" IS NULL OR "shoot_duration" IN ('1-3_days', '4-7_days', '1-2_weeks', '3-4_weeks', 'custom'));

ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_shoot_duration_custom_check";
ALTER TABLE "projects" ADD CONSTRAINT "projects_shoot_duration_custom_check"
  CHECK ("shoot_duration_custom" IS NULL OR "shoot_duration_custom" ~ '^[0-9]{1,3} (days|weeks|months)$');

ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_production_status_check";
ALTER TABLE "projects" ADD CONSTRAINT "projects_production_status_check"
  CHECK ("production_status" IS NULL OR "production_status" IN ('CONFIRMED', 'FUNDING_SECURED', 'IN_DEVELOPMENT', 'AWAITING_APPROVAL'));

-- ---------------------------------------------------------------------------------------------
-- 3. Agreement: a frozen copy of the terms, written when the crew member accepts a hire request
-- ---------------------------------------------------------------------------------------------
ALTER TABLE "hire_requests" ADD COLUMN IF NOT EXISTS "agreement" jsonb;

-- ---------------------------------------------------------------------------------------------
-- 4. Crew phone numbers: the obvious Indian formats (+91XXXXXXXXXX, 91XXXXXXXXXX, 0XXXXXXXXXX)
--    become the plain 10 digits. Anything else is left for the member to fix in their profile.
-- ---------------------------------------------------------------------------------------------
UPDATE "users"
SET "phone" = right(regexp_replace("phone", '[^0-9]', '', 'g'), 10)
WHERE "role" = 'CREW'
  AND "phone" IS NOT NULL
  AND regexp_replace("phone", '[^0-9]', '', 'g') ~ '^(91|0)?[0-9]{10}$'
  AND "phone" !~ '^[0-9]{10}$';
