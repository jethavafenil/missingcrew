-- 0006 — Drop the legacy NextAuth adapter tables. Supabase Auth (GoTrue) is
-- now the sole identity provider: sessions live in GoTrue, OAuth accounts in
-- auth.users identities, and email verification in auth.users.email_confirmed_at
-- (synced to public.users.email_verified by the 0005 trigger).
--
-- users.password is intentionally kept until the P3.4 legacy-user backfill
-- migrates those credentials into GoTrue.

DROP TABLE IF EXISTS "accounts" CASCADE;
DROP TABLE IF EXISTS "sessions" CASCADE;
DROP TABLE IF EXISTS "verification_tokens" CASCADE;
