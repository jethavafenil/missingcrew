-- 0004 — Signup role source fix + service_role grants.
--
-- 1) service_role (the app's repo-layer client, which bypasses RLS) had no
--    grants on the public schema — 0002 only granted anon/authenticated.
-- 2) GoTrue applies app_metadata AFTER the auth.users INSERT, so the
--    on_auth_user_created trigger could not read the signup role from
--    raw_app_meta_data. user_metadata IS present at insert time, so the
--    trigger reads the role from either, whitelisted to CREW/EMPLOYER
--    (ADMIN is never assignable at signup).

GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id text := gen_random_uuid()::text;
  new_role public."UserRole";
  requested_role text;
  new_name text;
BEGIN
  requested_role := COALESCE(
    NULLIF(new.raw_app_meta_data ->> 'role', ''),
    NULLIF(new.raw_user_meta_data ->> 'role', '')
  );

  IF requested_role = 'CREW' OR requested_role = 'EMPLOYER' THEN
    new_role := requested_role::public."UserRole";
  ELSE
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
