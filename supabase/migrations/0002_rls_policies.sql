-- 0002 — Row Level Security. Enables RLS on every business/legacy table and
-- attaches the policies from docs/supabase-migration-design.md §3.
-- service_role (admin client, background jobs) always bypasses RLS.
-- The legacy NextAuth tables (accounts/sessions/verification_tokens) get RLS
-- enabled with NO policies so only service-role/Prisma can touch them.

-- ############ GRANTS (PostgREST roles) ############
-- RLS is the actual gate; grants just allow the roles to attempt access.

GRANT USAGE ON SCHEMA public TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- ############ users ############

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_public_profile" ON "users"
  FOR SELECT USING (true);

CREATE POLICY "users_insert_own" ON "users"
  FOR INSERT WITH CHECK (auth_id = auth.uid());

CREATE POLICY "users_update_own_or_admin" ON "users"
  FOR UPDATE USING (auth_id = auth.uid() OR public.is_admin())
  WITH CHECK (auth_id = auth.uid() OR public.is_admin());

CREATE POLICY "users_delete_admin" ON "users"
  FOR DELETE USING (public.is_admin());

-- ############ crew_profiles ############

ALTER TABLE "crew_profiles" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crew_profiles_select_public" ON "crew_profiles"
  FOR SELECT USING (true);

CREATE POLICY "crew_profiles_insert_own" ON "crew_profiles"
  FOR INSERT WITH CHECK ("userId" = public.current_user_id());

CREATE POLICY "crew_profiles_update_own_or_admin" ON "crew_profiles"
  FOR UPDATE USING ("userId" = public.current_user_id() OR public.is_admin())
  WITH CHECK ("userId" = public.current_user_id() OR public.is_admin());

CREATE POLICY "crew_profiles_delete_admin" ON "crew_profiles"
  FOR DELETE USING (public.is_admin());

-- ############ employer_profiles ############

ALTER TABLE "employer_profiles" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employer_profiles_select_public" ON "employer_profiles"
  FOR SELECT USING (true);

CREATE POLICY "employer_profiles_insert_own" ON "employer_profiles"
  FOR INSERT WITH CHECK ("userId" = public.current_user_id());

CREATE POLICY "employer_profiles_update_own_or_admin" ON "employer_profiles"
  FOR UPDATE USING ("userId" = public.current_user_id() OR public.is_admin())
  WITH CHECK ("userId" = public.current_user_id() OR public.is_admin());

CREATE POLICY "employer_profiles_delete_admin" ON "employer_profiles"
  FOR DELETE USING (public.is_admin());

-- ############ projects ############

ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select_public" ON "projects"
  FOR SELECT USING (true);

CREATE POLICY "projects_insert_own_employer" ON "projects"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "employer_profiles" ep
      WHERE ep."id" = projects.employer_id AND ep."userId" = public.current_user_id()
    )
  );

CREATE POLICY "projects_update_owner_or_admin" ON "projects"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "employer_profiles" ep
      WHERE ep."id" = projects.employer_id AND ep."userId" = public.current_user_id()
    ) OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "employer_profiles" ep
      WHERE ep."id" = projects.employer_id AND ep."userId" = public.current_user_id()
    ) OR public.is_admin()
  );

CREATE POLICY "projects_delete_owner_or_admin" ON "projects"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "employer_profiles" ep
      WHERE ep."id" = projects.employer_id AND ep."userId" = public.current_user_id()
    ) OR public.is_admin()
  );

-- ############ applications ############

ALTER TABLE "applications" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "applications_select_involved" ON "applications"
  FOR SELECT USING (
    -- crew owner
    EXISTS (
      SELECT 1 FROM "crew_profiles" cp
      WHERE cp."id" = applications.crew_id AND cp."userId" = public.current_user_id()
    )
    -- project employer
    OR EXISTS (
      SELECT 1 FROM "projects" p
      JOIN "employer_profiles" ep ON ep."id" = p.employer_id
      WHERE p."id" = applications.project_id AND ep."userId" = public.current_user_id()
    )
    OR public.is_admin()
  );

CREATE POLICY "applications_insert_crew_owner" ON "applications"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "crew_profiles" cp
      WHERE cp."id" = applications.crew_id AND cp."userId" = public.current_user_id()
    )
  );

CREATE POLICY "applications_update_involved" ON "applications"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "crew_profiles" cp
      WHERE cp."id" = applications.crew_id AND cp."userId" = public.current_user_id()
    )
    OR EXISTS (
      SELECT 1 FROM "projects" p
      JOIN "employer_profiles" ep ON ep."id" = p.employer_id
      WHERE p."id" = applications.project_id AND ep."userId" = public.current_user_id()
    )
    OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "crew_profiles" cp
      WHERE cp."id" = applications.crew_id AND cp."userId" = public.current_user_id()
    )
    OR EXISTS (
      SELECT 1 FROM "projects" p
      JOIN "employer_profiles" ep ON ep."id" = p.employer_id
      WHERE p."id" = applications.project_id AND ep."userId" = public.current_user_id()
    )
    OR public.is_admin()
  );

CREATE POLICY "applications_delete_admin" ON "applications"
  FOR DELETE USING (public.is_admin());

-- ############ subscription_plans ############

ALTER TABLE "subscription_plans" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscription_plans_select_public" ON "subscription_plans"
  FOR SELECT USING (true);

CREATE POLICY "subscription_plans_write_admin" ON "subscription_plans"
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ############ subscriptions ############

ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select_own_or_admin" ON "subscriptions"
  FOR SELECT USING ("userId" = public.current_user_id() OR public.is_admin());

CREATE POLICY "subscriptions_insert_own" ON "subscriptions"
  FOR INSERT WITH CHECK ("userId" = public.current_user_id());

CREATE POLICY "subscriptions_update_own_or_admin" ON "subscriptions"
  FOR UPDATE USING ("userId" = public.current_user_id() OR public.is_admin())
  WITH CHECK ("userId" = public.current_user_id() OR public.is_admin());

CREATE POLICY "subscriptions_delete_admin" ON "subscriptions"
  FOR DELETE USING (public.is_admin());

-- ############ notifications ############

ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own_or_admin" ON "notifications"
  FOR SELECT USING (user_id = public.current_user_id() OR public.is_admin());

CREATE POLICY "notifications_insert_admin" ON "notifications"
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "notifications_update_own_or_admin" ON "notifications"
  FOR UPDATE USING (user_id = public.current_user_id() OR public.is_admin())
  WITH CHECK (user_id = public.current_user_id() OR public.is_admin());

CREATE POLICY "notifications_delete_own_or_admin" ON "notifications"
  FOR DELETE USING (user_id = public.current_user_id() OR public.is_admin());

-- ############ wishlists ############

ALTER TABLE "wishlists" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wishlists_owner_or_admin" ON "wishlists"
  FOR ALL USING (user_id = public.current_user_id() OR public.is_admin())
  WITH CHECK (user_id = public.current_user_id() OR public.is_admin());

-- ############ connections ############

ALTER TABLE "connections" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "connections_select_involved" ON "connections"
  FOR SELECT USING (
    requester_id = public.current_user_id()
    OR receiver_id = public.current_user_id()
    OR public.is_admin()
  );

CREATE POLICY "connections_insert_requester" ON "connections"
  FOR INSERT WITH CHECK (requester_id = public.current_user_id());

CREATE POLICY "connections_update_involved" ON "connections"
  FOR UPDATE USING (
    requester_id = public.current_user_id()
    OR receiver_id = public.current_user_id()
    OR public.is_admin()
  )
  WITH CHECK (
    requester_id = public.current_user_id()
    OR receiver_id = public.current_user_id()
    OR public.is_admin()
  );

CREATE POLICY "connections_delete_involved" ON "connections"
  FOR DELETE USING (
    requester_id = public.current_user_id()
    OR receiver_id = public.current_user_id()
    OR public.is_admin()
  );

-- ############ legacy NextAuth tables — service-role only ############

ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verification_tokens" ENABLE ROW LEVEL SECURITY;

-- ############ realtime ############
-- Stream complete row payloads for live-updated tables (supersedes Pusher).

ALTER TABLE "notifications" REPLICA IDENTITY FULL;
ALTER TABLE "wishlists" REPLICA IDENTITY FULL;
ALTER TABLE "connections" REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "notifications", "wishlists", "connections";
  END IF;
END $$;