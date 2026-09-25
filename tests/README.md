# Test suites

Runner: [vitest](https://vitest.dev) + `@testing-library/react` (jsdom).
Config: [`vitest.config.ts`](../vitest.config.ts).

## Layout

| Suite | Files | What it covers | Needs credentials? |
|---|---|---|---|
| Unit | `src/lib/**/*.test.ts` | repo row mappers, scope/requester helpers, `parseBody`/`ApiError`, payments subscription state + webhook idempotency | No |
| Validation | `tests/validation-schemas.test.ts` | zod schema shapes for register/apply payloads | No |
| Component | `tests/components/*.test.tsx` | ContactForm, ApplyModal, CrewSignupForm, SubscriptionPlans (fetch mocked) | No |
| RLS integration | `tests/integration/rls.test.ts` | P9.1 RLS assertions against a live DB | **Yes** (self-skips without env) |
| Smoke | `scripts/test-smoke-flow.mjs` (`npm run test:smoke`) | sign-up → profile → apply → subscribe against a running server | **Yes** + running app |

## Commands

```bash
npm test                # everything that needs no credentials (unit + validation + component)
npm run test:watch      # watch mode
npm run test:coverage   # coverage over src/lib/**
npm run test:ci         # junit reporter → test-results/junit.xml (for CI)
npm run test:rls        # RLS integration only
npm run test:smoke      # full funnel against http://localhost:3000 (override with SMOKE_BASE_URL)
```

## Credential-driven suites

RLS + smoke tests require a Supabase project with all migrations applied:

```bash
supabase start          # local disposable stack (auto-confirms emails)
supabase db reset       # apply migrations + seed

# RLS integration (read env automatically via vitest):
$env:SUPABASE_URL = 'http://127.0.0.1:54321'
$env:SUPABASE_ANON_KEY = '<local anon key>'   # printed by `supabase start`
npm run test:rls
```

- RLS tests **self-skip** when `SUPABASE_URL`/`SUPABASE_ANON_KEY` are unset, so
  `npm test` is always green without credentials.
- Email confirmation must be **off** (or auto) for RLS tests to sign in — the
  local dev stack default. On staging with confirmation ON, set
  `RLS_TESTS_ALLOW_UNCONFIRMED=false` to skip them explicitly.
- Smoke (`scripts/test-smoke-flow.mjs`) additionally needs the app running and
  service-role key (reads `.env.local`) — it auto-confirms the throwaway users
  itself via the admin API.

## Conventions

- Tests live next to the code (`src/**/*.test.ts`) or under `tests/`.
- Server-only modules are importable thanks to the `server-only` no-op stub
  (`tests/stubs/server-only.ts`, aliased in vitest.config.ts).
- No test may require real credentials in CI: mock `fetch`/Supabase clients or
  let credential-gated suites skip.
- The two payments tests use injected fake repos (no Supabase client at all).
