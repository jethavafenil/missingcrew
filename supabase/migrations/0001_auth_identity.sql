-- 0001 — Supabase Auth identity integration (additive).
-- Links the existing public.users (TEXT cuid PK) to auth.users (uuid) via a
-- new auth_id column, auto-provisions the users row + placeholder crew/employer
-- profile on signup, and exposes SECURITY DEFINER helpers for RLS policies.
--
-- Safe against live data: existing rows keep their id; auth_id is back-filled
-- in P3.4 (docs/supabase-auth-migration.md). Non-destructive.

ALTER TABLE "users"
  ADD COLUMN "auth_id" uuid;

CREATE UNIQUE INDEX "users_auth_id_key" ON "users" ("auth_id");

ALTER TABLE "users"
  ADD CONSTRAINT "users_auth_id_fkey" FOREIGN KEY ("auth_id")
  REFERENCES auth.users ("id") ON DELETE SET NULL;

-- ############ ROLE HELPERS (used by RLS in 0002) ############
-- SECURITY DEFINER so policies can resolve the app user WITHOUT recursing
-- through RLS on public.users. auth.uid() comes from the request JWT.

CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id FROM public.users u WHERE u.auth_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public."UserRole"
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.role FROM public.users u WHERE u.auth_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT true FROM public.users u
                   WHERE u.auth_id = auth.uid() AND u.role = 'ADMIN'::public."UserRole"
                   LIMIT 1), false);
$$;

-- ############ AUTO-PROVISION ON SIGNUP ############
-- Mirrors the app's NextAuth behavior (src/lib/auth.ts): a signup creates the
-- users row plus a placeholder profile, with the role read from
-- raw_app_meta_data.role (set by the Supabase client at signUp time, matching
-- the user's CREW/EMPLOYER selection).

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id text := gen_random_uuid()::text;
  new_role public."UserRole";
  new_name text;
BEGIN
  -- Role from app metadata; safe cast with a CREW fallback.
  BEGIN
    SELECT (new.raw_app_meta_data ->> 'role')::public."UserRole" INTO new_role;
  EXCEPTION WHEN invalid_text_representation THEN
    new_role := 'CREW'::public."UserRole";
  END;

  IF new_role IS NULL THEN
    new_role := 'CREW'::public."UserRole";
  END IF;

  BEGIN
    new_name := COALESCE(NULLIF(new.raw_user_meta_data ->> 'name', ''), new.email);
  EXCEPTION WHEN OTHERS THEN
    new_name := new.email;
  END;

  INSERT INTO public.users (
    id, auth_id, name, email, email_verified, role, created_at, updated_at
  ) VALUES (
    new_user_id,
    new.id,
    new_name,
    COALESCE(new.email, ''),
    CASE WHEN new.email_confirmed_at IS NOT NULL THEN new.email_confirmed_at END,
    new_role,
    now(),
    now()
  ) ON CONFLICT (auth_id) DO NOTHING;

  IF new_role = 'EMPLOYER'::public."UserRole" THEN
    INSERT INTO public.employer_profiles (id, "userId", company_name, company_website, completed, created_at, updated_at)
    VALUES (gen_random_uuid()::text, new_user_id, new_name, NULL, false, now(), now())
    ON CONFLICT ("userId") DO NOTHING;
  ELSE
    INSERT INTO public.crew_profiles (
      id, "userId", photo, city, budget_range_min, budget_range_max,
      "budgetFlexible", primary_roles, years_experience, location,
      available_to_travel, availability, availability_start, availability_end,
      project_types, daily_budget_min, daily_budget_max, languages, imdb_link,
      portfolio_links, past_projects, referred_by, contact_whatsapp,
      terms_agreed, subscription_tier, trial_ends, completed, created_at, updated_at
    ) VALUES (
      gen_random_uuid()::text, new_user_id, NULL, NULL, NULL, NULL,
      false, '[]'::jsonb, NULL, NULL,
      false, true, NULL, NULL,
      '[]'::jsonb, NULL, NULL, '[]'::jsonb, NULL,
      '[]'::jsonb, NULL, NULL, NULL,
      false, 'FREE_TRIAL'::public."SubscriptionTier", NULL, false, now(), now()
    )
    ON CONFLICT ("userId") DO NOTHING;
  END IF;

  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();