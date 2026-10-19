-- 0013 — Post-a-project overhaul (Phase 2).
--
-- * Shoot dates become OPTIONAL (producers often don't know them yet). Relaxing
--   NOT NULL is backward compatible: every existing row keeps its dates.
-- * Budget range (per day) with an optional FIXED budget flag. For a fixed
--   budget the app stores the same amount in budget_min and budget_max.
-- * production_house: the production company, shown on the project and used
--   later for Verified Production Credits.
-- All new columns are nullable / defaulted, so existing code keeps working.

ALTER TABLE "projects" ALTER COLUMN "shoot_start_date" DROP NOT NULL;
ALTER TABLE "projects" ALTER COLUMN "shoot_end_date" DROP NOT NULL;

ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "budget_min" integer;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "budget_max" integer;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "budget_fixed" boolean NOT NULL DEFAULT false;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "production_house" text;

ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_budget_range_check";
ALTER TABLE "projects" ADD CONSTRAINT "projects_budget_range_check"
  CHECK (
    (budget_min IS NULL OR budget_min >= 0)
    AND (budget_max IS NULL OR budget_max >= 0)
    AND (budget_min IS NULL OR budget_max IS NULL OR budget_max >= budget_min)
  );

ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_shoot_dates_check";
ALTER TABLE "projects" ADD CONSTRAINT "projects_shoot_dates_check"
  CHECK (shoot_start_date IS NULL OR shoot_end_date IS NULL OR shoot_end_date >= shoot_start_date) NOT VALID;
