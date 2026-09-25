-- P8 hot-path indexes. All statements are idempotent so this migration can be
-- reconciled safely with indexes that already exist in older environments.
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;

CREATE INDEX IF NOT EXISTS projects_status_created_at_idx
  ON public.projects (status, created_at DESC);
CREATE INDEX IF NOT EXISTS projects_status_location_created_at_idx
  ON public.projects (status, location, created_at DESC);
CREATE INDEX IF NOT EXISTS projects_project_name_trgm_idx
  ON public.projects USING gin (project_name extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS projects_location_trgm_idx
  ON public.projects USING gin (location extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS projects_description_trgm_idx
  ON public.projects USING gin (description extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS crew_profiles_updated_at_idx
  ON public.crew_profiles (updated_at DESC);
CREATE INDEX IF NOT EXISTS crew_profiles_available_updated_idx
  ON public.crew_profiles (availability, updated_at DESC);
CREATE INDEX IF NOT EXISTS crew_profiles_city_trgm_idx
  ON public.crew_profiles USING gin (city extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS crew_profiles_location_trgm_idx
  ON public.crew_profiles USING gin (location extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS crew_profiles_primary_roles_gin_idx
  ON public.crew_profiles USING gin (primary_roles);
CREATE INDEX IF NOT EXISTS crew_profiles_project_types_gin_idx
  ON public.crew_profiles USING gin (project_types);

CREATE INDEX IF NOT EXISTS applications_crew_applied_at_idx
  ON public.applications (crew_id, applied_at DESC);
CREATE INDEX IF NOT EXISTS applications_project_status_idx
  ON public.applications (project_id, status);
CREATE INDEX IF NOT EXISTS subscriptions_status_period_end_idx
  ON public.subscriptions (status, current_period_end);
CREATE INDEX IF NOT EXISTS notifications_user_read_created_idx
  ON public.notifications (user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS connections_receiver_status_created_idx
  ON public.connections (receiver_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS connections_requester_status_created_idx
  ON public.connections (requester_id, status, created_at DESC);

COMMENT ON EXTENSION pg_stat_statements IS
  'Use Supabase Reports > Query Performance (or query pg_stat_statements) for top-N latency and call counts.';
