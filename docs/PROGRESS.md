# MissingCrew — Progress Log

Running log of work done on top of the inherited codebase, newest first. Read this
together with `docs/HANDOFF.md` (architecture) and
`docs/client-25-tasks-audit-and-roadmap.md` (client task list) when resuming.

> Note: `HANDOFF.md` is partly out of date. Where it disagrees with the code, trust the code
> (e.g. there is no `/api/auth/signin`, `/api/auth/signup` or `/api/razorpay/create-order`;
> the real routes are `/api/auth/register/{crew,employer}`, `/api/subscriptions/create`, …).

---

## 2026-10-21 — Producer side, step 1: Hire Now -> crew approval — built, NOT yet committed

Before: "Hire Now" on a crew profile only sent a *connection* request. There was no real hiring flow.

- **Migration `0015`** (applied to the test DB): `hire_requests` (producer, crew, project, role, message, status
  PENDING/ACCEPTED/DECLINED/CANCELLED; unique per project+crew; server-only access) and notification kinds
  `HIRE_REQUEST` / `HIRE_RESPONSE`.
- **API** (`/api/hire-requests`): producer creates a request for one of *their open projects* (ownership checked, rate
  limited, 1000-char message, duplicates/declines/accepted handled; a cancelled request can be re-sent); crew accepts or
  declines; producer can cancel. Lists never expose the other side's email.
- **Accepting** turns the crew member's application for that project into **HIRED** (created if they never applied) — this is
  the single source of truth that credits, "current engagement", the hired-projects count and reviews will read.
- **Hire Now dialog** (producers): choose project and role, premade editable message (`buildHireMessage`), mobile-friendly.
  If the producer has no open project it asks them to post one. Status of earlier requests shows under the button.
- **Crew dashboard**: new "Hire requests" tab with a pending badge (deep link `/dashboard?tab=requests`) with Accept/Decline.
  **Producer dashboard**: "Hire requests you sent" (status + cancel) at the top of the Hire Now tab.
- Crew gets a bell notification + email; producer gets a bell notification + email on the answer. Emails are sent after the
  response so the UI doesn't wait for SMTP.
- Verified: 30-check API test (all rules/authorization), real browser run of the full flow (send -> crew sees it -> accept).
- Note: the notification bell's realtime subscription stopped working after migration 0011 (browser can't read tables);
  it still refreshes on focus. Worth replacing with polling or a server push later.

Next producer-side steps: verified credits + current engagement + hired count on the crew profile (built on this),
reviews, bucket list + HIRE ALL, crew filters (profession/city/radius/dates/gender), contact + one-click message,
minimal producer signup.

## 2026-10-20 — Crew vs Producer separation (client feedback) — built, NOT yet committed

Client feedback: producers saw projects / Find Work / a subscription, and crew and producers felt like the same experience.
Findings: a correctly-registered producer already had the EMPLOYER role and could post projects, but role separation was only
partial (client-side) and the default signup form was Crew, so producers often registered as crew by mistake.

- **Explicit account type switch** ("I'm Crew" / "I'm Hiring") at the very top of the signup/sign-in page (also on phones).
- **Server-side role guards** (`src/lib/auth/role-guard.ts`): producers are redirected away from Find Work, crew-home,
  subscription pages and crew profile setup/wishlist; crew are redirected away from `/employer/*` and employer-home.
  Guests and admins are not affected.
- **No subscriptions for producers**: Stripe checkout, subscription create/manage and verify-session return 403 for non-crew.
  Producers post unlimited projects (no limit exists in the code).
- **Landing after sign-in/signup**: crew -> Find Work (projects), producers -> Browse Crew (crew profiles + Post a Job).
- Employer-home "Post a Requirement" now goes straight to the post form for signed-in producers.
- Crew subscription card now shows the real trial benefits (unlimited applications, PRO badge, trial end date) instead of the
  Basic plan's "10 gigs/month".
- Verified with a 24-check role test (producer/crew/guest) plus re-runs of the earlier 58 end-to-end checks.

## 2026-10-20 — Tags, premade share message, email verification ON

- **Custom project tags** (migration `0014`, applied): the type hashtag is automatic; producers may add up to 3 free-text tags
  (normalised to CamelCase letters/digits, de-duplicated) with clickable suggestions from `src/lib/projectTags.ts` (starter
  list — the client will supply the final one). Shown on cards and the project page.
- **Premade messages** (`src/lib/shareMessages.ts`): profile share text is pre-filled (editable in the share dialog; native
  share sheet on phones). `buildHireMessage` is ready for the Hire Now flow (Phase 5).
- **Email verification is ON in live** (`REQUIRE_EMAIL_VERIFICATION=true`). Checked with a throwaway signup: account created
  unconfirmed, sign-in blocked until the emailed link is clicked (test account deleted).
- Decision: project type stays a fixed list; custom tags are optional extras.

## 2026-10-19 — Phase 2 (Post a Project) — built, NOT yet committed/deployed

| Item | What changed |
|---|---|
| Project type | One shared list (`src/lib/projectTypes.ts`): Ads, Web Series, Feature Films, Documentary, Music Video, TV Show, Short Film, Corporate Video. Used by the post form, project filters, crew filters. |
| Crew profession | Existing searchable multi-select kept (required, at least one). |
| Shoot dates | Now **optional** (migration `0013` drops NOT NULL; applied to the test DB). Every place that showed dates is null-safe: cards, project page, apply modal, dashboards, wishlist, find-work filter/sort ("Dates flexible"; dateless projects sort last and don't match date filters). |
| Budget | New per-day **min-max** or **Fixed** budget (`budget_min/max/fixed`). Shown on project cards and the project page; fixed stores the same amount in min and max. |
| Production house | New optional field (`production_house`), shown on the project page; groundwork for Verified Production Credits. |
| Screening questions | Every new project is pre-filled with "Have you done this type of project before?" and "Have you worked with the required equipment/software?" (editable/removable). Blank questions are dropped server-side. |
| Validation | One shared schema (`src/lib/projects/schema.ts`) now validates both create and edit (edit was unvalidated before). Clear messages for bad budget range, dates, roles, contact methods. Past start dates are blocked on create, and on edit only when the start date is changed. |
| Mobile | Form checked at 375px: no horizontal overflow, full-width inputs, stacked budget/date fields. |

Verified: `tsc`, 86 unit tests, build, and a 29-check end-to-end run (create with/without dates, fixed/range budget, all validation
paths, public + owner reads and SSR pages with null dates, apply to a dateless project, edit set/clear, ownership + auth guards).
Test data cleaned up.

Open: city keyword matching needs a LocationIQ key (`NEXT_PUBLIC_LOCATIONIQ_API_KEY` is not set locally or on Vercel, so the
location autocomplete only works as plain text). AI title/description deferred by decision.

## 2026-10-19 — Phase 1 (quick wins) — built, NOT yet committed/deployed

| Task | What changed |
|---|---|
| #20 2-month free trial | Migration `0012` (applied to the test DB): new crew profiles get `trial_ends = signup + 60 days` (email + OAuth). During an active trial crew can apply to **unlimited** projects; afterwards the free cap is 10/month. Rules live in `src/lib/subscription/access.ts` (tested). Referral bonus now *extends* the trial. |
| #3 PRO badge | Badge shows for PRO members **and everyone on an active trial** (`hasProBadge`, exposed by `/api/crew` and `/api/crew/[id]`). Disappears when the trial ends unless PRO. |
| #6 Budget per day | Profile shows "₹X - ₹Y per day" and a green **Negotiable** pill (`budgetFlexible`). Crew card budget removal is Phase 4. |
| #22 Shortlist | **New:** `PUT /api/employer/projects/[id]/applications/[appId]` (employer-only, ownership-checked; PENDING/SHORTLISTED/REJECTED). Employer dashboard now has Shortlist / Reject / Undo + real status badges (there was no way to shortlist before). Shortlisting notifies the crew in-app (bell) and by email, once per transition. Crew dashboard shows "Shortlisted"; rejected applicants still see "Applied" (intentionally gentle). |
| #23 Milestone emails | Producer gets an in-app notification + email when a project is posted, and again when it reaches exactly 5 applications. |
| #9 Footer | Social URLs moved to `src/lib/site-config.ts` (**client must supply the real links**; they are still guesses). |
| Emails | All templates HTML-escape names/titles; links use `NEXT_PUBLIC_SITE_URL` instead of a hard-coded domain. |

Verified: `tsc`, 80 unit tests, production build, plus a 21-check end-to-end run against the local server and test DB
(trial, post, past-date block, 5 applications → one milestone, shortlist + dedupe, 401/403/404 guards). The test cleaned up
all of its temporary users/projects. Decisions taken: PRO badge during trial; post-trial free cap stays 10/month.

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
