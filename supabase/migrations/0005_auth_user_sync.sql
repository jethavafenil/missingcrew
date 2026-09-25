-- 0005 — Sync auth.users updates into public.users.
--
-- GoTrue applies several fields (email_confirmed_at, app_metadata, merged
-- user_metadata) via UPDATE after the initial INSERT, so the INSERT-time
-- trigger can't see them. This UPDATE trigger keeps public.users in sync:
-- email verification, name, and role changes made through GoTrue metadata
-- (e.g. role changed via the Supabase dashboard).

CREATE OR REPLACE FUNCTION public.sync_auth_user_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public."UserRole";
BEGIN
  BEGIN
    SELECT (new.raw_app_meta_data ->> 'role')::public."UserRole" INTO v_role;
  EXCEPTION WHEN invalid_text_representation THEN
    v_role := NULL;
  END;

  UPDATE public.users SET
    email_verified = CASE
      WHEN new.email_confirmed_at IS NOT NULL THEN new.email_confirmed_at
      ELSE email_verified
    END,
    name = COALESCE(NULLIF(new.raw_user_meta_data ->> 'name', ''), name),
    role = COALESCE(v_role, role),
    updated_at = now()
  WHERE auth_id = new.id;

  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_auth_user_update();
