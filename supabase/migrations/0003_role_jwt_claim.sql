-- 0003 — Role as a JWT claim via custom access token hook.
--
-- public.users.role stays the single source of truth (admin role changes in
-- the app update it there). The hook copies it into every access token as
-- `role`, so middleware and RLS can read `auth.jwt() ->> 'role'` without a
-- DB lookup. app_metadata.role (set at signup) only seeds the users row via
-- the 0001 trigger; it is NOT authoritative.
--
-- The hook must live in the public schema: the auth schema is owned by
-- supabase_admin on the hosted platform and is not writable by postgres.

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  claims jsonb;
  v_role public."UserRole";
BEGIN
  claims := event->'claims';

  SELECT u.role INTO v_role
  FROM public.users u
  WHERE u.auth_id = (event->'claims'->>'sub')::uuid
  LIMIT 1;

  IF v_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{role}', to_jsonb(v_role::text));
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM PUBLIC, authenticated, anon;
