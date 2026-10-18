# MissingCrew — Lead Developer Hand-Off Documentation

> **Version:** 0.2.0
> **Last Updated:** October 2026
> **Status:** Production (deployed to Vercel)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack & Versions](#2-tech-stack--versions)
3. [Repository Layout](#3-repository-layout)
4. [Environment Setup](#4-environment-setup)
5. [Architecture Deep-Dive](#5-architecture-deep-dive)
6. [Database Schema](#6-database-schema)
7. [API Routes Reference](#7-api-routes-reference)
8. [Key Components](#8-key-components)
9. [Payments Integration](#9-payments-integration)
10. [Testing Guide](#10-testing-guide)
11. [Deployment Guide](#11-deployment-guide)
12. [Feature Roadmap (Remaining Tasks)](#12-feature-roadmap-remaining-tasks)
13. [Known Issues & Gotchas](#13-known-issues--gotchas)
14. [Contribution Guidelines](#14-contribution-guidelines)

---

## 1. Project Overview

**MissingCrew** is a two-sided marketplace that connects **film/media producers (Employers)** with **freelance crew members (Crew)**.

| Role | Core Actions |
|---|---|
| **Crew** | Create profile -> Browse projects -> Apply -> Track application status |
| **Employer** | Post projects -> Browse crew cards -> Shortlist / Hire applicants -> Manage subscriptions |
| **Admin** | Manage users, projects, applications, and subscriptions via the admin panel |

Live at: `https://missingcrew.com` (Vercel deployment).

---

## 2. Tech Stack & Versions

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | ^16.1.0 |
| UI Library | React | 19.1.0 |
| Styling | Tailwind CSS | ^3.4.18 |
| UI Primitives | Radix UI | Various |
| Backend-as-a-Service | Supabase (PostgreSQL + Auth + Storage) | ^2.58.0 |
| ORM / Data Layer | Custom typed repository (no ORM, raw PostgREST) | - |
| Data Fetching (client) | SWR | ^2.3.8 |
| Payment - India | Razorpay | ^2.9.6 |
| Payment - Global | Stripe | ^20.1.0 |
| Email | Nodemailer (SMTP) | ^7.0.11 |
| Rate Limiting | rate-limiter-flexible + Redis | ^8.0.1 |
| Testing | Vitest | ^4.1.11 |
| Type Checking | TypeScript | ^5 |
| Linting | ESLint (Next.js config) | ^9 |
| Deployment | Vercel | - |

---

## 3. Repository Layout

```
missingcrew/
├── docs/                         # Project documentation
│   ├── HANDOFF.md                # This file
│   └── client-25-tasks-audit-and-roadmap.md
├── public/                       # Static assets
├── scripts/                      # One-off maintenance scripts
├── src/
│   ├── app/                      # Next.js App Router pages & API routes
│   │   ├── page.tsx              # Public homepage
│   │   ├── layout.tsx            # Root layout (SessionProvider, ThemeProvider)
│   │   ├── accounts/             # Login / signup page (tab-based)
│   │   ├── auth/                 # OAuth callback handler
│   │   ├── crew/                 # Crew public profile: /crew/[id]
│   │   ├── crew-home/            # Crew dashboard / feed
│   │   ├── employer/             # Employer profile and dashboard
│   │   ├── dashboard/            # Shared employer dashboard
│   │   ├── admin/                # Admin panel (role-gated)
│   │   ├── browse-crew/          # Crew discovery page
│   │   ├── find-work/            # Project listing for crew
│   │   ├── projects/[id]/        # Project detail page
│   │   ├── subscription-plans/   # Pricing page
│   │   ├── subscription-management/ # Manage active subscription
│   │   └── api/                  # All backend API routes (route handlers)
│   │       ├── auth/             # Session, signup, OTP, OAuth
│   │       ├── crew/             # Crew profile CRUD + applied-projects batch
│   │       ├── employer/         # Employer profile + project management
│   │       ├── projects/         # Public project listing + per-project details
│   │       ├── admin/            # Admin-only data APIs
│   │       ├── notifications/    # In-app notification management
│   │       ├── wishlist/         # Wishlist management
│   │       ├── subscriptions/    # Subscription status checks
│   │       ├── stripe/           # Stripe webhook + checkout
│   │       └── razorpay/         # Razorpay webhook + order creation
│   │
│   ├── components/               # React components
│   │   ├── Header.tsx / Footer.tsx
│   │   ├── applications/         # ApplyModal, application status components
│   │   ├── auth/ auth-forms/     # Login/signup forms, OTP UI
│   │   ├── crew/                 # Crew card, crew filters
│   │   ├── crew-profile/         # Full crew profile sections
│   │   ├── dashboard/            # Employer & crew dashboard panels
│   │   ├── notifications/        # Notification bell + dropdown
│   │   ├── projects/             # ProjectCard, ProjectCardWrapper, ProjectDetailsPage
│   │   ├── subscription/         # Subscription plan UI, Razorpay/Stripe checkout
│   │   └── ui/                   # Shared Radix/Shadcn primitives
│   │
│   ├── lib/                      # Shared business logic & utilities
│   │   ├── api.ts                # apiFetch() - ALWAYS use this for client fetches
│   │   ├── auth/                 # Auth helpers (server.ts, session-context.tsx)
│   │   ├── crew/
│   │   │   └── applied-projects.ts  # Client-side applied/wishlisted cache + hook
│   │   ├── email.ts              # Nodemailer email sender
│   │   ├── env.ts                # Validated server-side env vars (Zod schema)
│   │   ├── payments/             # Stripe & Razorpay helpers
│   │   ├── rateLimiter.ts        # Rate limiting configuration
│   │   ├── redis.ts              # Redis client (for rate limiting)
│   │   └── repo/                 # Data access layer (see Section 5.3)
│   │
│   └── types/                    # Global TypeScript type declarations
│
├── supabase/
│   ├── migrations/               # Ordered SQL migrations
│   ├── config.toml               # Local Supabase project config
│   └── seed.sql                  # Dev seed data
│
├── tests/                        # Integration & RLS tests
├── middleware.ts                 # Edge middleware: session cookie refresh
├── next.config.ts                # Next.js configuration
├── tailwind.config.js            # Tailwind theme + custom tokens
└── vitest.config.ts              # Test runner configuration
```

---

## 4. Environment Setup

### Prerequisites
- Node.js 20+, npm
- A Supabase project (https://supabase.com or local Supabase CLI)
- Optionally: Redis, Razorpay/Stripe accounts, SMTP credentials

### Steps

```bash
# 1. Clone and install
git clone https://github.com/khadim123/missingcrew.git
cd missingcrew
npm install

# 2. Create .env.local from the template
cp .env.example .env.local
# Fill in values (see table below)

# 3. Apply database migrations
npx supabase db push   # requires SUPABASE_DB_URL set

# 4. Start dev server
npm run dev
# -> http://localhost:3000
```

### Key Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | YES | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | YES | Supabase anonymous key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | YES | Service role key (server-only, bypasses RLS) |
| `SUPABASE_URL` | YES | Same as public URL (server-side alias) |
| `SUPABASE_DB_URL` | Optional | Direct postgres URL for migration scripts |
| `EMAIL_HOST / EMAIL_PORT / EMAIL_USER / EMAIL_PASSWORD / EMAIL_FROM` | Optional | SMTP credentials |
| `RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET / RAZORPAY_WEBHOOK_SECRET` | Optional | Razorpay |
| `STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET` | Optional | Stripe |
| `PAYMENT_PROVIDER` | Optional | razorpay or stripe (default: stripe) |
| `REDIS_URL` | Optional | Redis for rate limiting (falls back to in-memory) |
| `ADMIN_CREATION_SECRET` | Optional | Secret for creating admin accounts via API |
| `MOCK_SMS` | Dev only | Set 1 to skip real OTP SMS sending |

> NEVER commit .env.local or .env - both are gitignored.

---

## 5. Architecture Deep-Dive

### 5.1 Next.js App Router Structure

- **Server Components** (default): render on server, can directly call repository functions
- **Client Components** (`use client`): handle interactivity, read session via `useSession()`
- **Route Handlers** (`route.ts` in `app/api/`): handle API requests using `getSession()` + repo functions

**Role-based redirect:**
```
Login -> determines role -> redirects to:
  CREW     -> /crew-home
  EMPLOYER -> /employer/dashboard
  ADMIN    -> /admin
```

Route guards in `src/lib/auth/server.ts`:
- `requireUser()` - redirects to login if unauthenticated
- `requireRole(role)` - redirects to role home if wrong role

### 5.2 Authentication Flow

Authentication uses **Supabase Auth (GoTrue)**. There is NO NextAuth.

```
User submits credentials
      |
/api/auth/signup or /api/auth/signin
      |
Supabase Auth issues JWT + refresh token -> stored in httpOnly cookies
      |
middleware.ts refreshes cookies on every request
      |
Server components call getSession() -> validates JWT -> reads public.users row
      |
SessionProvider (client) stores session -> useSession() hook
```

**Key auth files:**

| File | Purpose |
|---|---|
| `src/lib/auth/server.ts` | getSession(), requireUser(), requireRole() - server-side only |
| `src/lib/auth/session-context.tsx` | SessionProvider, useSession() hook - client-side |
| `src/lib/auth/client.ts` | Browser-side Supabase client factory |
| `middleware.ts` | Refreshes session cookies on every non-static request |

**Email verification:** Configured in Supabase dashboard. Currently NOT enforced - users can log in immediately after signup. Enable "Require email confirmation" in Supabase Auth settings to enforce it.

**OAuth (Google):** Callback at `/auth/callback/route.ts` -> links identity to existing user via migration `0009_oauth_email_link.sql`.

### 5.3 Repository (Data Access) Layer

All DB operations go through `src/lib/repo/`. No ORM - wraps Supabase PostgREST calls, maps snake_case to camelCase TypeScript objects.

**Repository files:**

| File | Handles |
|---|---|
| `user.repo.ts` | public.users - find, create, update |
| `crewProfile.repo.ts` | crew_profiles - crew profile CRUD |
| `employerProfile.repo.ts` | employer_profiles - employer profile CRUD |
| `project.repo.ts` | projects - CRUD, listing, filtering |
| `application.repo.ts` | applications - apply, update status, list |
| `subscription.repo.ts` | subscriptions + subscription_plans |
| `wishlist.repo.ts` | wishlists - save/remove crew or projects |
| `connection.repo.ts` | connections - follow/connect requests |
| `notification.repo.ts` | notifications - create/read/mark-read |

**Requester pattern (auth scoping):**
```ts
const session = await getSession()
const requester = requesterFromSession(session)  // { userId, role }
await projectRepo.findById(id, requester)
// repo uses requester.role to choose anon vs service-role client
```

### 5.4 Client-Side State & Caching

#### Applied / Wishlisted Project Status (`src/lib/crew/applied-projects.ts`)

**Problem solved:** Without caching, every ProjectCard needed individual fetch requests causing N+1 queries and 3-5 second delays on "Applied" button state.

**Solution:**
1. **localStorage persistence** - IDs stored as `mc_applied_${userId}` and `mc_wishlist_${userId}`. Read instantly on page load (frame 0).
2. **In-memory Set cache** - Module-level Set shared across all components in same tab.
3. **Single batch fetch** - One call to `/api/crew/applied-projects` fetches ALL applied/wishlisted IDs. `fetchPromise` prevents duplicate concurrent fetches.
4. **Global listener pattern** - Components subscribe via `listeners.add(listener)`. When any component calls `markProjectAppliedLocally()`, ALL visible cards update instantly.

**Usage:**
```tsx
const { hasApplied, isWishlisted, setHasApplied, setIsWishlisted } = useProjectStatus(
  project.id,
  initialHasApplied,   // optional: server-side pre-computed value
  initialIsWishlisted  // optional: server-side pre-computed value
)
```

---

## 6. Database Schema

Migrations are in `supabase/migrations/`. Apply in order via `supabase db push`.

### Core Tables

#### `public.users`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | App user ID |
| `auth_id` | UUID | Links to auth.users.id (Supabase Auth) |
| `name` | TEXT | Display name |
| `email` | TEXT UNIQUE | |
| `role` | ENUM | CREW, EMPLOYER, ADMIN |
| `password` | TEXT | Bcrypt hash (email/password auth) |
| `phone` / `phone_verified` | TEXT / BOOL | |
| `image` | TEXT | Avatar URL |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

#### `public.crew_profiles`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK users | |
| `photo` | TEXT | Profile photo URL |
| `primary_roles` | TEXT[] | e.g. ['Cinematographer', 'Editor'] |
| `location` / `city` | TEXT | |
| `years_experience` | TEXT | e.g. '5' |
| `availability` | BOOL | Available for hire |
| `availability_start/end` | DATE | Available date range |
| `available_to_travel` | BOOL | |
| `project_types` | TEXT[] | Preferred project types |
| `daily_budget_min/max` | INT | Per-day rate |
| `budget_flexible` | BOOL | Negotiable flag |
| `languages` | JSONB | |
| `imdb_link` | TEXT | |
| `portfolio_links` | TEXT[] | |
| `past_projects` | JSONB | |
| `contact_whatsapp` | TEXT | |
| `subscription_tier` | ENUM | FREE_TRIAL, BASIC, PRO |
| `trial_ends` | TIMESTAMPTZ | |
| `completed` | BOOL | Profile completion flag |
| `terms_agreed` | BOOL | |

#### `public.employer_profiles`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK users | |
| `company_name` | TEXT | |
| `company_website` | TEXT | |
| `completed` | BOOL | |

#### `public.projects`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `employer_id` | UUID FK employer_profiles | |
| `project_name` | TEXT | |
| `project_type` | TEXT | e.g. 'Feature Film', 'Ad Film' |
| `roles_needed` | TEXT[] | |
| `shoot_start_date` / `shoot_end_date` | DATE | |
| `location` | TEXT | |
| `budget_per_role` | JSONB | |
| `description` | TEXT | |
| `questions` | JSONB | Screening questions |
| `contact_preference` | JSONB | |
| `status` | ENUM | OPEN, CLOSED, FILLED |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

#### `public.applications`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `project_id` | UUID FK projects | |
| `crew_id` | UUID FK crew_profiles | |
| `status` | ENUM | PENDING, SHORTLISTED, REJECTED, HIRED |
| `applied_at` | TIMESTAMPTZ | Ordered ASC (first-apply-first) |
| `employer_notes` / `crew_notes` | TEXT | |
| `answers` | JSONB | Screening question answers |

#### `public.subscriptions`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK users | |
| `plan_id` | UUID FK subscription_plans | |
| `status` | ENUM | ACTIVE, CANCELED, PAST_DUE, UNPAID |
| `razorpay_subscription_id` | TEXT | |
| `stripe_subscription_id` / `stripe_customer_id` | TEXT | |
| `current_period_start/end` | TIMESTAMPTZ | |

#### Other Tables
- **`public.wishlists`** - (user_id, crew_id?, project_id?) - polymorphic wishlist
- **`public.connections`** - (requester_id, receiver_id, status) - follow/connect system
- **`public.notifications`** - in-app notification records
- **`public.subscription_plans`** - plan definitions (name, price, features, Stripe price ID)

### Row-Level Security (RLS)
RLS policies are in `supabase/migrations/0002_rls_policies.sql`. They ensure:
- Users can only read/write their own profile data
- Applications readable only by crew member and project employer
- Admin role (via JWT claim) bypasses all RLS

---

## 7. API Routes Reference

### Auth
| Route | Method | Description |
|---|---|---|
| `/api/auth/session` | GET | Returns current session (used by SessionProvider) |
| `/api/auth/signup` | POST | Email/password signup (creates auth.users + public.users) |
| `/api/auth/signin` | POST | Email/password sign in |
| `/api/auth/signout` | POST | Invalidates session |
| `/api/auth/verify-otp` | POST | OTP verification |
| `/api/auth/resend-otp` | POST | Resend OTP |

### Projects
| Route | Method | Description |
|---|---|---|
| `/api/projects` | GET | Public project list (paginated, filterable) |
| `/api/projects/[id]` | GET | Single project detail |

### Crew
| Route | Method | Description |
|---|---|---|
| `/api/crew` | GET | Crew listing for Browse Crew page |
| `/api/crew/[id]` | GET | Single crew profile |
| `/api/crew/applied-projects` | GET | BATCH - returns all applied + wishlisted project IDs for current crew |
| `/api/crew/profile` | GET / PUT | Crew's own profile management |
| `/api/crew/applications` | GET | Crew's submitted applications |

### Employer
| Route | Method | Description |
|---|---|---|
| `/api/employer/profile` | GET / PUT | Employer profile management |
| `/api/employer/projects` | GET / POST | List/create projects |
| `/api/employer/projects/[id]` | GET / PUT / DELETE | Manage a specific project |
| `/api/employer/projects/[id]/applications` | GET | Applications for a project |
| `/api/employer/projects/[id]/applications/[appId]` | PUT | Update application status |

### Payments
| Route | Method | Description |
|---|---|---|
| `/api/razorpay/create-order` | POST | Creates Razorpay order for subscription |
| `/api/razorpay/webhook` | POST | Razorpay payment confirmation webhook |
| `/api/stripe/create-checkout-session` | POST | Creates Stripe checkout session |
| `/api/stripe/webhook` | POST | Stripe payment/subscription webhook |

### Other
| Route | Method | Description |
|---|---|---|
| `/api/notifications` | GET / POST | Fetch and create notifications |
| `/api/notifications/[id]/read` | PUT | Mark notification as read |
| `/api/wishlist` | GET / POST / DELETE | Wishlist management |
| `/api/network/connections` | GET / POST | Connection system |
| `/api/user/change-password` | POST | Password change |
| `/api/contact` | POST | Contact form submission |
| `/api/admin/*` | Various | Admin-only routes (require ADMIN role) |

---

## 8. Key Components

### `ProjectCard` (`src/components/projects/ProjectCard.tsx`)
- Full project title (no truncation)
- Auto-generated hashtags from projectType (e.g. #FeatureFilm)
- Location, shoot dates/deadline, relative posted date badges
- Uses `useProjectStatus()` hook for instant applied/wishlisted state
- Apply button shows "Applied" immediately on click (optimistic update)

### `ApplyModal` (`src/components/applications/ApplyModal.tsx`)
- On submit: calls apply API endpoint
- Calls `markProjectAppliedLocally(projectId, userId)` immediately after success
- Handles "already applied" gracefully
- Closes modal on success

### `Header` (`src/components/Header.tsx`)
- Reads `useSession()` for role-based navigation
- Different nav items for CREW / EMPLOYER / ADMIN / unauthenticated
- Notification bell with unread count

### `SessionProvider` (`src/lib/auth/session-context.tsx`)
- Wraps the app in `src/app/layout.tsx`
- Accepts `initialSession` from server layout for zero-flash auth state
- Listens to `onAuthStateChange` from Supabase client

---

## 9. Payments Integration

Two payment providers supported. Active one set by `PAYMENT_PROVIDER` env var.

### Razorpay (India)
- Order creation: `POST /api/razorpay/create-order` -> returns order_id
- Client checkout: Razorpay JS SDK opens payment modal
- Webhook: `POST /api/razorpay/webhook` -> verifies HMAC signature, activates subscription in DB
- Key file: `src/lib/razorpay.ts`

### Stripe (Global)
- Checkout: `POST /api/stripe/create-checkout-session` -> returns session.url, redirects user
- Webhook: `POST /api/stripe/webhook` -> verifies signature, handles checkout.session.completed
- Key file: `src/lib/stripe.ts`

> IMPORTANT: Webhook endpoints must be configured in both Razorpay and Stripe dashboards.

---

## 10. Testing Guide

### Running Tests

```bash
# Run all unit tests
npm run test

# Watch mode
npm run test:watch

# With coverage report
npm run test:coverage

# Integration tests (requires real Supabase connection)
npm run test:integration

# RLS policy tests only
npm run test:rls

# Smoke test
npm run test:smoke
```

### Test Structure

```
tests/
  integration/
    rls.test.ts       - Row-Level Security policy verification
src/lib/repo/
  helpers.test.ts     - Repository helper unit tests
  scope.test.ts       - Repository scoping tests
  types.test.ts       - Type mapper tests
```

### Pre-Commit Checklist (MANDATORY)

```bash
npx tsc --noEmit        # Must pass with 0 errors
npm run test            # All tests must pass (12 suites, 66 tests)
npm run build           # Production build must succeed
```

---

## 11. Deployment Guide

### Production: Vercel

The app auto-deploys on push to `main`.

```bash
# Manual deploy
npm install -g vercel
vercel login
vercel --prod
```

Set all environment variables in Vercel dashboard (Settings -> Environment Variables).

### Database Migrations

```bash
# Create migration file:
# supabase/migrations/NNNN_descriptive_name.sql

# Push to production Supabase
npx supabase db push --db-url "$SUPABASE_DB_URL"
```

> RULE: Migrations must be STRICTLY ADDITIVE. Never drop or alter existing columns.

### Post-Deployment Checklist
1. Homepage loads at live URL
2. Crew login -> crew-home loads correctly
3. Employer login -> employer dashboard loads
4. Apply to a project -> "Applied" state shows immediately (no page refresh)
5. Check Vercel function logs for runtime errors

---

## 12. Feature Roadmap (Remaining Tasks)

25 client requirements were audited. Items completed are marked done.

### Completed
- Task 1: Job card layout & hashtags (full title, metadata badges, hashtags, apply button)
- Task 24: Application ordering (first-apply-first, ORDER BY applied_at ASC)
- Apply button instant state: localStorage caching + batch API endpoint

### Remaining (recommended order)

| # | Task | Phase | Effort |
|---|---|---|---|
| 9 | Footer cleanup (remove placeholder phone, add real social links) | 1 | Low |
| 8 | Preserve redirect URL after login (?redirectUrl=) | 1 | Low |
| 25 | Post a Project refinements + AI description assistant | 2 | High |
| 2 | Crew card overhaul + YouTube hover video preview | 3 | High |
| 17 | Bucket List ("Add to Cart") + "HIRE ALL" batch booking | 3 | Medium |
| 18 | Advanced crew filtering (profession, city, radius, dates, gender) | 3 | Medium |
| 3 | PRO badge + career start date ("Working since Oct 2018") | 4 | Low |
| 4 | Mobile responsiveness + identity gating on crew profile | 4 | Medium |
| 5 | Portfolio tab with project-type category links | 4 | Low |
| 6 | Budget "Per Day" display + "Negotiable" badge | 4 | Low |
| 19 | Direct producer contacts (IMDb, email, phone, WhatsApp) | 4 | Low |
| 10 | HIRE NOW popup + crew accept/decline workflow | 5 | High |
| 11 | Verified Production Credits badge on crew profile | 5 | Medium |
| 12 | Current Engagement widget on crew profile | 5 | Medium |
| 13 | Reviews & Ratings system (new reviews table) | 5 | High |
| 7 | Platform experience counter (verified hired projects) | 5 | Low |
| 14 | Post-signup role routing (Crew -> /find-work, Employer -> /browse-crew) | 6 | Low |
| 15 | Progressive crew profile + 1-click apply with portfolio links | 6 | Medium |
| 16 | Streamlined producer onboarding (minimal initial fields) | 6 | Low |
| 20 | 2-month free trial auto-grant on new crew signup | 6 | Low |
| 21 | Referral link generator | 6 | Medium |
| 22 | Shortlist in-app + email notification | 6 | Medium |
| 23 | Producer job milestone emails (on creation + after 5 applications) | 6 | Medium |

See `docs/client-25-tasks-audit-and-roadmap.md` for full detailed breakdown with code file references.

---

## 13. Known Issues & Gotchas

### Auth & Session
- **Email verification** is NOT currently enforced. To enforce, enable "Require email confirmation" in Supabase Auth dashboard.
- `getSession()` is memoized with React cache() - runs once per request in RSC trees. Do not call in client components.
- After signout, use `window.location.href = '/'` (not router.push) to clear all server component caches.

### Data Layer
- All repos use PostgREST, not raw SQL. Complex queries may require PostgreSQL functions called via `supabase.rpc()`.
- The `mapXxx()` functions in `types.ts` handle snake_case -> camelCase. When adding new DB columns, ALWAYS add the mapping.
- RLS policies MUST be tested after any schema change. Run `npm run test:rls`.

### Client-Side Caching
- Applied/wishlisted cache is per-browser-tab. Opening multiple tabs will not sync instantly - values sync on next page load via localStorage.
- If a different user logs in on same device, the cache resets automatically in `fetchUserProjectStatuses()`.

### Payments
- Stripe and Razorpay webhook handlers must be excluded from CSRF middleware (they use their own signature verification).
- Webhook secrets must be rotated in both payment dashboard AND Vercel env vars simultaneously.

### Build & TypeScript
- Run `npx tsc --noEmit` before every commit. Strict TypeScript is enforced.
- The `use client` directive is required at the top of any file using hooks, browser APIs, or event handlers.
- Always use `apiFetch()` from `src/lib/api.ts` instead of raw `fetch()` for client-side requests.

---

## 14. Contribution Guidelines

### Workflow
1. Create feature branch from main: `git checkout -b feat/task-name`
2. Pattern: Inspect -> Understand -> Trace Dependencies -> Verify -> Plan -> Modify -> Test -> Regression Check
3. Run pre-commit checklist: `npx tsc --noEmit && npm run test && npm run build`
4. Keep commits atomic and descriptive
5. Never modify existing DB columns - add new optional columns only
6. Get explicit approval before merging to main (triggers auto-deploy)

### Code Style
- TypeScript strict mode - no implicit `any`
- Tailwind CSS for all styling - no inline styles, no external CSS libraries
- Use existing Radix UI primitives in `src/components/ui/` before creating new ones
- Repository methods handle all DB access - no direct Supabase calls from components
- Client fetches always use `apiFetch()` from `src/lib/api.ts`

### Adding a New Feature

**DB change needed?**
- Create migration: `supabase/migrations/NNNN_description.sql` (additive only)
- Add `mapXxx()` mapper in `src/lib/repo/types.ts`
- Add repo method in `src/lib/repo/xxx.repo.ts`

**New API endpoint?**
- Create `src/app/api/[path]/route.ts`
- Use `getSession()` + `requesterFromSession()` for auth
- Call repository methods, return `NextResponse.json()`

**New UI page/component?**
- Server component by default
- Add `use client` only if hooks / browser events needed
- Use `useSession()` for auth state in client components

---

*Prepared for MissingCrew project hand-off, October 2026.*
