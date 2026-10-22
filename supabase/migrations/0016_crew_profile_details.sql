-- 0016 — Extra crew profile details for the profile redesign and crew filters.
-- All additive and nullable/defaulted, so existing profiles keep working.
--   gender            'MALE' | 'FEMALE' | 'OTHER' (filter only; optional)
--   first_project_date first project month/year (stored as the 1st of that month)
--   showreel_url      main showreel (YouTube/Vimeo) shown on the card and profile
--   custom_tags       up to 5 hashtags the crew chose themselves

ALTER TABLE "crew_profiles" ADD COLUMN IF NOT EXISTS "gender" text;
ALTER TABLE "crew_profiles" ADD COLUMN IF NOT EXISTS "first_project_date" date;
ALTER TABLE "crew_profiles" ADD COLUMN IF NOT EXISTS "showreel_url" text;
ALTER TABLE "crew_profiles" ADD COLUMN IF NOT EXISTS "custom_tags" text[] NOT NULL DEFAULT '{}';

ALTER TABLE "crew_profiles" DROP CONSTRAINT IF EXISTS "crew_profiles_gender_check";
ALTER TABLE "crew_profiles" ADD CONSTRAINT "crew_profiles_gender_check"
  CHECK ("gender" IS NULL OR "gender" IN ('MALE', 'FEMALE', 'OTHER'));
