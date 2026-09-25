-- 0008 — Link OAuth sign-ins to pre-existing public.users rows by email.
--
-- Problem: handle_new_auth_user (0001/0004) inserts into public.users with
-- ON CONFLICT (auth_id) DO NOTHING. But users.email has a UNIQUE constraint
-- (users_email_key, 0000). A Google OAuth sign-in whose email already exists
-- in public.users (pre-Supabase/Prisma-era rows, auth_id NULL — the pending
-- P3.4 backfill population) violates users_email_key, the conflict clause
-- doesn't catch it, the whole auth.users INSERT aborts, and GoTrue returns
-- "Database error saving new user" on the callback.
--
-- Fix: replace the function so a matching email UPDATEs the existing row's
-- auth_id (lazy P3.4 backfill at login time) instead of inserting a duplicate.
-- The profile-provision step then reuses the EXISTING user id, so a
-- pre-existing profile is not duplicated either (ON CONFLICT ("userId")).
--
-- Also switches the DO NOTHING clauses to explicit match checks so the
-- function keeps working for fresh signups exactly as before.

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id text;
  new_role public."UserRole";
  requested_role text;
  new_name text;
  existing_id text;
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

  -- Is there already an app row for this auth id (re-run) or this email
  -- (pre-Supabase row, auth_id NULL)? Link it instead of inserting.
  SELECT u.id INTO existing_id
  FROM public.users u
  WHERE u.auth_id = new.id
     OR (u.email = new.email AND u.auth_id IS NULL)
  LIMIT 1;

  IF existing_id IS NOT NULL THEN
    -- Lazy backfill: claim the pre-existing row for this auth user.
    UPDATE public.users SET
      auth_id = new.id,
      name = COALESCE(NULLIF(new.raw_user_meta_data ->> 'name', ''), name),
      email_verified = COALESCE(
        CASE WHEN new.email_confirmed_at IS NOT NULL THEN new.email_confirmed_at END,
        email_verified
      ),
      updated_at = now()
    WHERE id = existing_id;
    new_user_id := existing_id;
  ELSE
    INSERT INTO public.users (
      id, auth_id, name, email, email_verified, role, created_at, updated_at
    ) VALUES (
      gen_random_uuid()::text,
      new.id,
      new_name,
      COALESCE(new.email, ''),
      CASE WHEN new.email_confirmed_at IS NOT NULL THEN new.email_confirmed_at END,
      new_role,
      now(),
      now()
    ) RETURNING id INTO new_user_id;
  END IF;

  -- Provision the placeholder profile only if none exists for this user.
  IF new_role = 'EMPLOYER'::public."UserRole" THEN
    INSERT INTO public.employer_profiles (id, "userId", company_name, company_website, completed, created_at, updated_at)
    SELECT gen_random_uuid()::text, new_user_id, new_name, NULL, false, now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM public.employer_profiles WHERE "userId" = new_user_id);
  ELSE
    INSERT INTO public.crew_profiles (
      id, "userId", photo, city, budget_range_min, budget_range_max,
      "budgetFlexible", primary_roles, years_experience, location,
      available_to_travel, availability, availability_start, availability_end,
      project_types, daily_budget_min, daily_budget_max, languages, imdb_link,
      portfolio_links, past_projects, referred_by, contact_whatsapp,
      terms_agreed, subscription_tier, trial_ends, completed, created_at, updated_at
    )
    SELECT gen_random_uuid()::text, new_user_id, NULL, NULL, NULL, NULL,
      false, '[]'::jsonb, NULL, NULL,
      false, true, NULL, NULL,
      '[]'::jsonb, NULL, NULL, '[]'::jsonb, NULL,
      '[]'::jsonb, NULL, NULL, NULL,
      false, 'FREE_TRIAL'::public."SubscriptionTier", NULL, false, now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM public.crew_profiles WHERE "userId" = new_user_id);
  END IF;

  RETURN new;
END;
$$;
