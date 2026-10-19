-- 0014 — Optional custom hashtags on a project (up to 3, validated in the app).
-- The main hashtag still comes from the project type; these are extras the
-- producer chooses (e.g. #Thriller, #Mumbai). Additive: defaults to an empty list.

ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "tags" text[] NOT NULL DEFAULT '{}';
