-- 0017 — Reviews: only a producer who HIRED a crew member on a project can review them,
-- once per project. Enforced in the API (hired application required); the unique index
-- keeps it to one review per (project, crew) at the database level too.
--
-- Access is through the server (service role) only, like every other app table (0011).

CREATE TABLE IF NOT EXISTS "reviews" (
  "id"          text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "crew_id"     text NOT NULL REFERENCES "crew_profiles"("id") ON DELETE CASCADE,
  "employer_id" text NOT NULL REFERENCES "employer_profiles"("id") ON DELETE CASCADE,
  "project_id"  text NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "rating"      integer NOT NULL CHECK ("rating" BETWEEN 1 AND 5),
  "comment"     text NOT NULL DEFAULT '' CHECK (char_length("comment") <= 1000),
  "created_at"  timestamp(3) NOT NULL DEFAULT now(),
  "updated_at"  timestamp(3) NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "reviews_project_crew_key" ON "reviews" ("project_id", "crew_id");
CREATE INDEX IF NOT EXISTS "reviews_crew_idx" ON "reviews" ("crew_id", "created_at" DESC);

ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "reviews" FROM anon, authenticated;
GRANT ALL ON "reviews" TO service_role;
