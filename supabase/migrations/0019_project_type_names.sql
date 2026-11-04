-- 0019 — Project types now come from one longer list (Feature Film, Ad Film, Corporate Film,
-- Documentary Film, Television Series, ...). Older names saved before are renamed so crew
-- work and producer projects keep matching and the hashtags stay consistent.
--   Ads / Ad Films -> Ad Film, Feature Films -> Feature Film, Documentary -> Documentary Film,
--   Corporate Video -> Corporate Film, Commercial -> Ad Film, TV Series -> Television Series

CREATE OR REPLACE FUNCTION pg_temp.map_project_type(t text) RETURNS text AS $$
  SELECT CASE lower(btrim(t))
    WHEN 'ads' THEN 'Ad Film'
    WHEN 'ad films' THEN 'Ad Film'
    WHEN 'feature films' THEN 'Feature Film'
    WHEN 'documentary' THEN 'Documentary Film'
    WHEN 'corporate video' THEN 'Corporate Film'
    WHEN 'commercial' THEN 'Ad Film'
    WHEN 'tv series' THEN 'Television Series'
    ELSE btrim(t)
  END
$$ LANGUAGE sql IMMUTABLE;

-- projects: one text, possibly "A, B"
UPDATE "projects" p
SET "project_type" = (
  SELECT string_agg(DISTINCT pg_temp.map_project_type(x), ', ')
  FROM unnest(string_to_array(p."project_type", ',')) AS x
  WHERE btrim(x) <> ''
)
WHERE p."project_type" IS NOT NULL
  AND p."project_type" <> ''
  AND p."project_type" IS DISTINCT FROM (
    SELECT string_agg(DISTINCT pg_temp.map_project_type(x), ', ')
    FROM unnest(string_to_array(p."project_type", ',')) AS x
    WHERE btrim(x) <> ''
  );

-- crew_profiles.project_types: jsonb array of names
UPDATE "crew_profiles" c
SET "project_types" = COALESCE((
  SELECT jsonb_agg(DISTINCT pg_temp.map_project_type(x))
  FROM jsonb_array_elements_text(c."project_types") AS x
), '[]'::jsonb)
WHERE jsonb_typeof(c."project_types") = 'array'
  AND jsonb_array_length(c."project_types") > 0;

-- crew_profiles.past_projects: jsonb array of objects with an optional "type"
UPDATE "crew_profiles" c
SET "past_projects" = (
  SELECT jsonb_agg(
    CASE
      WHEN jsonb_typeof(e) = 'object' AND e ? 'type' AND jsonb_typeof(e->'type') = 'string'
        THEN jsonb_set(e, '{type}', to_jsonb(pg_temp.map_project_type(e->>'type')))
      ELSE e
    END
  )
  FROM jsonb_array_elements(c."past_projects") AS e
)
WHERE jsonb_typeof(c."past_projects") = 'array'
  AND jsonb_array_length(c."past_projects") > 0;
