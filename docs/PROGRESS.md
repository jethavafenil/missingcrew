# MissingCrew — Progress Log

Running log of work done on top of the inherited codebase, newest first. Read this
together with `docs/HANDOFF.md` (architecture) and
`docs/client-25-tasks-audit-and-roadmap.md` (client task list) when resuming.

> Note: `HANDOFF.md` is partly out of date. Where it disagrees with the code, trust the code
> (e.g. there is no `/api/auth/signin`, `/api/auth/signup` or `/api/razorpay/create-order`;
> the real routes are `/api/auth/register/{crew,employer}`, `/api/subscriptions/create`, …).

---

## 2026-10-26 — Feedback round 2 — built, NOT yet committed

- **Hashtags are premade only** (`TAG_GROUPS` in `src/lib/projectTags.ts` — edit that one list when the client sends theirs).
  Producers pick up to 3 and crew up to 5 with the new `TagPicker` (tap chips, searchable). The server drops anything not on the
  list (projects, crew profile, matching), so old hand-made tags simply stop showing.
- **Multi-select crew filters**: roles, hashtags (searchable tick-boxes that stay open), project types, gender, languages as
  chips; everything applies instantly; removable chips for every selected value above the results; hashtag click on a card adds/removes it.
  (`src/lib/crewFilters.ts`, `MultiSelect`.) URL links like `?tag=Thriller` or `?roles=Editor,Gaffer` still work.
- **Current engagement** disappears by itself: it is computed from the shoot dates on every visit (ended = moved to Credits).
  A project that is only "closed" to applications is NOT treated as ended, because its shoot can still be running.
- **Role label** (Crew / Producer / Admin) at the top right of the avatar and in its menu.
- **Role pictures**: crew without a photo get a department picture (camera, lighting, sound, makeup, costume, art, direction,
  post, ...) chosen from their main role (`src/lib/roleVisuals.ts`, `RolePlaceholder`). Drawn icons, not downloaded photos
  (no copyright/hot-link risk); can be swapped for real artwork later in one file.
- **Free mode** (migration `0018_site_settings`): default OFF = everything free, no trial, no pricing/upgrade prompts, unlimited
  applications, PRO badge for everyone, payment endpoints return 403. Admin panel > Settings > "Free mode / Plans" turns trials and
  paid plans on (optionally giving every crew member a fresh 2-month trial) and back off. Pages read `/api/settings/public`.
- **Home page** (logged out): top jobs + crew now come right after the hero, the numbers moved below them; projects take ~30% and
  crew ~70% (3 crew cards per row on wide screens, same card as Browse Crew); pricing section only when plans are on; the closing
  "Ready to Elevate Your Career?" band removed (there was no newsletter form on the page, that band was the end section).

## 2026-10-25 — Test feedback round 1 — built, NOT yet committed

- **Thumbnails**: if a showreel thumbnail fails to load (or there is none and no photo) the card and profile now show a neutral
  placeholder instead of a broken image.
- **Hashtags on cards** are clickable on Browse Crew (filters in place); on other pages they open Browse Crew filtered.
- **Notifications**: the list opens on hover (desktop; tap on phones) and **clicking one opens the right page**
  (`src/lib/notificationLinks.ts`): hire request -> crew Hire requests tab, hire answer -> producer Hire tab, new application ->
  Applications tab, shortlisted -> My Applications, matching project -> the project page. Producer dashboard now honours `?tab=`.
- **Bucket list button** (heart + count) beside the bell for producers.
- **Matching-project notifications**: when a producer posts a project, crew with a needed role, not booked, and a match score >= 55
  (role + project type/hashtags/city/budget, `src/lib/projects/matchCrew.ts`) get an in-app notification ("New project matches your
  profile, 80% match") — sent after the response so posting stays fast. No email on purpose (avoid spam); easy to add for >= 80%.
  Tests set `MATCH_NOTIFY_EMAIL_PREFIX=qa-` so only QA accounts are notified on the shared DB.
- **Speed**: the functions ran in Vercel `iad1` (US East) while the Supabase database is in Tokyo (AWS ap-northeast-1), so every
  query paid a ~170 ms round trip and a page makes several in a row. `vercel.json` now pins functions to `hnd1` (Tokyo). Also the crew
  profile page now fetches profile/credits/reviews in parallel.

## 2026-10-23 — Bucket list + HIRE ALL, messages, crew card, one-click apply, referral link, producer signup — built, NOT yet committed

- **Bucket list + HIRE ALL** (`/employer/wishlist`, the old wishlist renamed): tick people, pick a project, one message
  (`{name}` becomes each first name), `POST /api/hire-requests/batch` (max 20, per-person results, duplicates/declined reported
  with the reason). The single and batch routes share `src/lib/hire/send.ts`.
- **Message a crew member** (profile > Contact, producers only): `POST /api/messages` creates a notification + an email with
  Reply-To = the producer, so the conversation continues by email. Rate limited; the crew address is never returned.
- **Crew card overhaul** (`CrewCard`): reel on top that plays on hover (tap on phones), name, role, location, "Since <month>",
  availability dates, hashtags, View Full Profile. Budget, project types and languages removed. Home crew cards lost the rate too.
  Home project cards now show the full title, hashtags and posted date.
- **One-click apply**: screening questions are now optional ("Apply now"); the producer's applicant preview shows the
  crew's work of the same project type first, marked "Relevant", so nothing has to be attached by hand.
- **Referral link** (crew dashboard card, WhatsApp share): `/accounts?tab=signup&role=crew&ref=<crew profile id>`; remembered in the
  browser, pre-filled in the profile form, and when the new member completes their profile the referrer gets +2 months
  (existing rule, now also accepts the code; self-referral and non-trial referrers are ignored).
- **Producer signup**: full name, production company, mobile number (validated, stored normalised), email, password.
- **Skipped on purpose**: "add to cart" (the bucket list heart already covers it) and the map-radius filter (waiting for the
  LocationIQ key; gender/date/city/profession/hashtag filters are in).
- Tests: unit 152, e2e incl. new `e2e-more` (HIRE ALL, messages, referral, signup phone).

## 2026-10-22 — Producer side, steps 2-4: credits, hashtags/match, split-screen review, profile redesign, reviews — built, NOT yet committed

- **Migrations `0016`, `0017`** (applied to the test DB): `crew_profiles.gender / first_project_date / showreel_url / custom_tags`;
  `reviews` table (one per project+crew, rating 1-5, server-only access).
- **Verified credits + current engagement + hired count**: `/api/crew/[id]/credits`, derived from HIRED applications (so both
  accepted hire requests and the old shortlist-to-hire path count). Rules are pure + tested in `src/lib/crew/credits.ts`
  (role = hired role, else matching needed role, else main role; ONGOING/UPCOMING/COMPLETED/CONFIRMED by shoot dates).
  Guests only get the count.
- **Hashtags + matching** (`src/lib/matching.ts`): crew tags are derived from project types (declared + portfolio) plus up to 5
  tags the crew chose; `matchScore` (role 40, type 25, tags 15, city 15, budget 5) drives "Best match %". `/browse-crew?tag=X`.
- **Crew profile redesign** (`/crew/[id]`): photo, name, PRO, role, location, availability, "since" month, per-day budget
  (+Negotiable), hashtag chips, stats (first project, hired on MissingCrew, portfolio projects, rating), Current engagement
  card, tabs Showreel / Projects (by type, work links) / Credits / Reviews / Skills & Details / Availability / Contact.
  Mobile-first (scrollable tabs, stacked layout). Showreel plays on click (YouTube thumbnail first).
- **Guests** (not signed in) see the card-level info only; work links, IMDb, credit details and contact are stripped on the
  server (`src/lib/crew/guestView.ts`). Contact is still producer/owner only. Sign-in returns to the same profile.
- **Email** button opens a Gmail compose tab on desktop and the phone's mail app on mobile (`src/lib/contactLinks.ts`).
- **Crew profile form** now asks: first project month/year, gender (optional), showreel link, hashtags, project type per
  past project. All validated server-side (`src/lib/crew/profileFields.ts`).
- **Split-screen applicant review** (producer dashboard > Applications): project picker, Applications / Shortlisted / Hired /
  Rejected tabs, sort by Best match / First applied / Newest, list left + profile preview right (showreel, key skills,
  fee, availability, portfolio, credits, screening answers), Shortlist / Hire / Reject / Undo. Hire opens the Hire Now dialog
  with the project preselected.
- **Reviews**: `POST /api/reviews` (producer must own the project and have HIRED that crew member; one review per project,
  re-posting edits it), `GET /api/crew/[id]/reviews` (public list + average; producers also get which projects they can review).
- **Filters** (browse crew): added Free-on-date, Gender, Hashtag. Logic moved to `src/lib/crewFilters.ts` (unit tested).
- Verified: 150+ unit tests; e2e suites incl. new `e2e-profile` (profile fields, guest vs signed-in view, credits, reviews).

Still to do (producer side): bucket list + HIRE ALL, map-radius filter (needs LocationIQ key), one-click in-app message,
minimal producer signup. Crew side: crew card overhaul, progressive profile + 1-click apply, referral link. AI writer last.

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
