-- 0011 — Close direct PostgREST access to application tables.
--
-- Problem (found in security audit): 0002 granted anon SELECT and
-- authenticated full DML on every public table, and its RLS policies are
-- permissive:
--   * users / crew_profiles / employer_profiles / projects: SELECT USING (true)
--     -> anyone holding the PUBLIC anon key could read every user's email,
--        phone, password column and WhatsApp number straight from the REST API.
--   * users_update_own_or_admin has no column restriction, and is_admin() reads
--     users.role -> any signed-in user could PATCH their own row to
--     role = 'ADMIN' and become an admin.
--   * subscriptions / crew_profiles self-update -> self-granted PRO tier.
--
-- The application never queries these tables as anon/authenticated: every
-- data access goes through the server-side repo layer using the service_role
-- key (src/lib/repo/client.ts), and the browser Supabase client is used for
-- Auth only. So the correct fix is to remove the table privileges from the
-- client-facing roles entirely. RLS stays enabled as defense in depth.
--
-- service_role is unaffected (0004 granted it everything). Auth (GoTrue), the
-- custom access token hook and the signup trigger are SECURITY DEFINER and do
-- not depend on these grants. Reversible with GRANT if ever needed.

REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
