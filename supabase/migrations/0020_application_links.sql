-- 0020 — Links a crew member chooses to send with an application (from their profile links,
-- IMDb, showreel and past-project links). Additive; existing applications get an empty list.

ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "shared_links" jsonb NOT NULL DEFAULT '[]'::jsonb;
