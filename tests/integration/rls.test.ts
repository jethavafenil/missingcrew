import { beforeAll, describe, expect, it } from 'vitest'
import { createClient } from '@supabase/supabase-js'

/**
 * RLS integration tests (from UPGRADE_PLAN.md P9.1 / P11.1b).
 *
 * These run against a real Supabase project with migrations applied — locally
 * (`supabase start`, `supabase db reset`) or staging. They SELF-SKIP when
 * SUPABASE_URL / SUPABASE_ANON_KEY are not provided, so `npm test` never needs
 * real credentials (CI uses a disposable local Supabase; see .github/workflows/ci.yml).
 *
 * Run with:  SUPABASE_URL=... SUPABASE_ANON_KEY=... npx vitest run tests/integration
 */

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
const canRun = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

// Email confirmation blocks sign-in on staging; the local dev stack
// (supabase/config.toml) auto-confirms, so these run primarily against it.
const EMAIL_CONFIRM_OK = process.env.RLS_TESTS_ALLOW_UNCONFIRMED !== 'false'

const RUN = canRun && EMAIL_CONFIRM_OK ? describe : describe.skip

function makeAnonClient() {
  return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

let crewA: Awaited<ReturnType<ReturnType<typeof makeAnonClient>['auth']['signUp']>>['data']['user']
let crewB: ReturnType<typeof makeAnonClient>
let employer: ReturnType<typeof makeAnonClient>
let employerId: string | null = null
let crewAProfileId: string | null = null

const stamp = Date.now()
const email = (kind: string) => `rls-${kind}-${stamp}@example.com`
const PASSWORD = 'TestPass123!'

async function signUp(kind: string, role: 'CREW' | 'EMPLOYER') {
  const client = makeAnonClient()
  const { data, error } = await client.auth.signUp({
    email: email(kind),
    password: PASSWORD,
    options: { data: { name: `RLS ${kind}`, role } },
  })
  if (error) throw new Error(`signUp ${kind} failed: ${error.message}`)
  // on_auth_user_created (0005) provisions public.users + profile rows.
  return { client, user: data.user! }
}

async function findProfile(client: ReturnType<typeof makeAnonClient>, table: 'crew_profiles' | 'employer_profiles', userId: string) {
  const { data, error } = await client.from(table).select('id').eq('"userId"', userId).maybeSingle()
  if (error) throw new Error(`findProfile ${table}: ${error.message}`)
  return data?.id ?? null
}

RUN('RLS policies end-to-end (anon/authenticated clients)', () => {
  beforeAll(async () => {
    const a = await signUp('crew-a', 'CREW')
    crewA = a.user
    const b = await signUp('crew-b', 'CREW')
    crewB = b.client
    const e = await signUp('employer', 'EMPLOYER')
    employer = e.client
    // Profile ids may lag a moment behind the trigger; poll briefly.
    for (let i = 0; i < 10 && !(crewAProfileId && employerId); i++) {
      if (!crewAProfileId) crewAProfileId = await findProfile(a.client, 'crew_profiles', crewA.id)
      if (!employerId) employerId = await findProfile(e.client, 'employer_profiles', e.user.id)
      if (!(crewAProfileId && employerId)) await new Promise((r) => setTimeout(r, 300))
    }
    expect(crewAProfileId, 'crew profile not provisioned by trigger').toBeTruthy()
    expect(employerId, 'employer profile not provisioned by trigger').toBeTruthy()
  }, 30_000)

  it('crew cannot update another crew\'s profile', async () => {
    // crewB's session attempts to patch crewA's profile row.
    const { data, error } = await crewB!
      .from('crew_profiles')
      .update({ city: 'HackedCity' })
      .eq('id', crewAProfileId!)
      .select('id')
    // RLS filters the row out of USING, so no rows match and nothing changes.
    expect(data ?? []).toHaveLength(0)
    // Verify the row was not modified via crewA's own public read.
    const { data: check } = await crewB!.from('crew_profiles').select('city').eq('id', crewAProfileId!).maybeSingle()
    expect(check?.city).not.toBe('HackedCity')
    if (error) expect(error.code).not.toBe('42501') // silent filter, not a raised error
  })

  it('employer cannot read another user\'s subscription rows', async () => {
    // Insert a subscription row for crewA via their own session (allowed).
    const crewAId = crewA!.id
    const crewAClient = makeAnonClient()
    await crewAClient.auth.signInWithPassword({ email: email('crew-a'), password: PASSWORD })
    await crewAClient
      .from('subscriptions')
      .insert({
        user_id: crewAId,
        plan_id: 'basic',
        status: 'ACTIVE',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(2027, 0, 1).toISOString(),
      })
    // Employer session tries to read it.
    const { data } = await employer!
      .from('subscriptions')
      .select('id')
      .eq('user_id', crewAId)
    expect(data ?? []).toHaveLength(0)
  })

  it('non-admin cannot create subscription plans', async () => {
    const { error } = await employer!
      .from('subscription_plans')
      .insert({ id: `malicious-${stamp}`, name: 'Evil', price: 1, description: 'no', features: [] })
    expect(error).toBeTruthy()
    expect(error!.code ?? '').toBe('42501') // insufficient_privilege / RLS
    // And the plan is not actually present.
    const { data } = await makeAnonClient().from('subscription_plans').select('id').eq('id', `malicious-${stamp}`)
    expect(data ?? []).toHaveLength(0)
  })

  it('anonymous users can read public projects/crew but not write', async () => {
    const anon = makeAnonClient()
    // Reads succeed (empty is fine — RLS must not raise).
    const projects = await anon.from('projects').select('id').limit(1)
    expect(projects.error).toBeNull()
    const crew = await anon.from('crew_profiles').select('id').limit(1)
    expect(crew.error).toBeNull()

    // Writes are denied.
    const ins = await anon.from('crew_profiles').insert({
      user_id: 'does-not-matter', primary_roles: [], portfolio_links: [],
      project_types: [], languages: [],
    })
    expect(ins.error).toBeTruthy()
    const upd = await anon.from('projects').update({ project_name: 'x' }).eq('id', '00000000-0000-0000-0000-000000000000')
    expect(upd.error).toBeTruthy()
  })
})
