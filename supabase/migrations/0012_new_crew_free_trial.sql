-- 0012 — 2-month free trial for every new crew signup.
--
-- New crew profiles (email signup and OAuth) are provisioned by
-- handle_new_auth_user with trial_ends = signup + 60 days. During an active
-- FREE_TRIAL the app lets crew apply to unlimited projects and shows the PRO
-- badge (see src/lib/subscription/access.ts). Existing profiles are NOT
-- touched. Only the trial_ends value of the crew INSERT changes; the function
-- is otherwise identical to 0009.

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
      false, 'FREE_TRIAL'::public."SubscriptionTier", now() + interval '60 days', false, now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM public.crew_profiles WHERE "userId" = new_user_id);
  END IF;

  RETURN new;
END;
$$;
