# MissingCrew — Progress Log

Running log of work done on top of the inherited codebase, newest first. Read this
together with `docs/HANDOFF.md` (architecture) and
`docs/client-25-tasks-audit-and-roadmap.md` (client task list) when resuming.

> Note: `HANDOFF.md` is partly out of date. Where it disagrees with the code, trust the code
> (e.g. there is no `/api/auth/signin`, `/api/auth/signup` or `/api/razorpay/create-order`;
> the real routes are `/api/auth/register/{crew,employer}`, `/api/subscriptions/create`, …).

---

## 2026-10-18 — Security hardening + signup/session UX fixes

### Ground rules we are following
- Verify existing behaviour before changing it; never break working flows.
- Migrations are additive/reversible. No existing columns changed.
- Server-side validation is authoritative; client validation is UX only.
- Nothing is pushed to `main`/Vercel without explicit approval (push = auto-deploy).

### Security fixes (all verified: `tsc`, unit tests, production build, manual browser checks)
| Area | Problem found | Fix |
|---|---|---|
| Supabase RLS / grants | `anon` could read the whole `users` table (emails, phones, password column) straight from the REST API with the public anon key; any signed-in user could `PATCH` their own `users.role` to `ADMIN`; self-grant of PRO via `crew_profiles` / `subscriptions` | Migration `0011_revoke_direct_table_access.sql` revokes all table privileges from `anon`/`authenticated`. The app only uses the service-role key server-side (browser client = Auth only). **Applied to the test Supabase project on 2026-10-18.** |
| `GET /api/crew/[id]?applications` | Unauthenticated; returned every application incl. employer notes, employer + crew emails/phones | Requires login; only the owning crew member (or admin); strips `employerNotes`, crew embed, employer email; `no-store` |
| `GET /api/network/user/[id]/connections` | Public; leaked emails/phones/WhatsApp of connections; id interpolated into a PostgREST `.or()` filter | Contact fields blanked; id validated against a safe charset (ids are TEXT: legacy cuids + uuids, **not** only UUIDs) |
| `GET /api/projects/[id]` | Public response included employer email | Email stripped |
| `POST /api/projects/[id]/apply` | Applied to closed/non-existent projects; returned employer contact data to the applicant; race → duplicate/500 | Checks project exists + `OPEN`; minimal response; duplicate-key race returns "Already applied" |
| `POST /api/crew/profile` | Mass assignment: client could send `subscriptionTier: "PRO"`, `trialEnds`, `phoneVerified: true`; self-referral; referral could downgrade a paying referrer | Server-controlled fields stripped; self-referral blocked; only trial referrers get the bonus |
| `POST /api/subscriptions/create` (Razorpay) | Marked the user ACTIVE/PRO **before payment** | Creates row as `UNPAID`; tier/ACTIVE now only set by the signed Razorpay webhook |
| Open redirect | `returnUrl` check accepted `/\evil.com` | Shared `isSafeReturnPath()` used in OAuth callback, accounts page, login forms |
| Auth forms | Submitting before hydration put credentials in the URL (GET) | Forms are `method="post"` |

### Auth / UX fixes
- **Signup now redirects to Sign-in and the form is gone** (root cause: `/accounts` copied `tab`/`role`
  from the URL into local state once, so the URL changed but the signup form stayed filled). URL is now
  the single source of truth. Email is pre-filled on the sign-in tab.
- **Employer signup has the same password rules as crew** (live checklist), enforced server-side for both
  roles (`src/lib/auth/password.ts`). Weak password / numeric-only name now show a clear message
  (validation errors from `parseBody` are surfaced instead of a generic 500).
- Contact/full name must contain letters (the employer test account had a phone number as name, which
  is why the avatar showed `+`).
- **Two accounts in one browser**: cookies are shared by all tabs of a browser profile, so the other tab
  kept showing the old user. `SessionProvider` now re-validates on tab focus/visibility and reloads the
  tab if the identity changed or logged out elsewhere.
- "View My Applications" now opens `/dashboard?tab=applications` (dashboard tabs are deep-linkable).
- Header: employers see **Post a Job** instead of Find Work; Home is role-aware.
- Footer: role-aware link sets (guest / crew / employer / admin); "For Employers" CTA only for guests.
- Post a Job: shoot start date cannot be in the past (HTML `min` + server check on create; on edit only
  if the start date was changed); end date must be ≥ start (server).

### Tests
- New `src/lib/utils.test.ts` (return-path safety, past-date check, name check, password policy).
- `tests/integration/rls.test.ts` updated to assert direct table access is denied (runs in CI against a
  disposable local Supabase; skipped without credentials).

### Open items / decisions needed
1. **Rotate the Supabase DB password** — `scripts/apply-missing-migrations.js` (tracked in git) contains a
   hard-coded connection string with a password. Rotate in the dashboard, then remove it from the script
   (and consider scrubbing git history).
2. **Email verification is not enforced**: register routes call `createUser({ email_confirm: true })`.
   Decide whether to require verification before launch (needs SMTP/Supabase email templates).
3. **Subscriptions fail locally** (`/subscription-success?success=false`): Stripe/Razorpay credentials,
   price ids and webhook secrets are not fully configured for this environment. Needs a dedicated pass
   (Stripe test keys + `stripe listen` for local webhooks).
4. `crew/profile` returns internal `error.message` on 500; `admin/create-user` is a "temporary" route that
   writes `public.users` without an `auth.users` row (the created admin cannot sign in) — remove or fix.
5. CSP still allows `'unsafe-inline'` scripts; rate limiting falls back to in-memory without `REDIS_URL`
   (ineffective on serverless) — set `REDIS_URL` in Vercel.
6. QA throwaway accounts (`claude.qa+…@example.com`) were created in the test Supabase project while
   verifying; delete them from Supabase Auth when convenient.
7. Phone number change in profile does not reset `phoneVerified`.

### Decisions
- **One role per email (for now).** A person who wants to be both crew and employer uses two emails.
  Dual-role accounts (one login, both profiles, role switcher) touch `users.role`, the JWT claim, RLS,
  route guards and the signup trigger, so it is planned as its own feature *after* launch, not squeezed
  into the current release.
- **Email verification is built but OFF** (`REQUIRE_EMAIL_VERIFICATION=false`). To enable:
  1. Provider with a verified sending domain (Resend / Brevo / SES / Google Workspace SMTP).
  2. Supabase Dashboard → Authentication → Emails → SMTP Settings: enable custom SMTP.
  3. Authentication → Emails → Templates → *Confirm signup* link:
     `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup`
  4. Authentication → URL Configuration: Site URL = live domain; add `<domain>/auth/callback` and
     `http://localhost:3000/auth/callback` to Redirect URLs.
  5. Authentication → Providers → Email: "Confirm email" ON.
  6. Vercel/.env.local: `EMAIL_HOST/PORT/SECURE/USER/PASSWORD/FROM` (app notification emails) and finally
     `REQUIRE_EMAIL_VERIFICATION=true`.
  Code: register routes create unconfirmed users + send the link; sign-in shows "Resend verification
  email"; `/api/auth/resend-verification` is rate limited and non-enumerating.

### Next up (from the roadmap)
Footer cleanup (#9), preserve-redirect-after-login for more entry points (#8), free-trial auto-grant (#20),
then Phase 2+ features. See `docs/client-25-tasks-audit-and-roadmap.md`.
