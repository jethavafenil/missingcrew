// P11.1d — end-to-end smoke test: sign-up → profile → apply → subscribe,
// against a running dev/prod server + staging (or local) Supabase.
// Verifies the core funnel stays green before any deploy:
//   1. crew register → trigger-provisioned public.users row
//   2. email confirm (service-role) → credentials sign-in (cookie session)
//   3. profile update via the crew profile API
//   4. employer posts a project, crew applies to it
//   5. subscription plans are readable and a subscription row is queryable
// Creates throwaway users and cleans them up afterwards.
//
// Run: node scripts/test-smoke-flow.mjs   (server must be running on :3000)

import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const BASE = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000'

if (!url || !serviceKey || !anonKey) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const admin = createSupabaseClient(url, serviceKey)

const stamp = Date.now()
const crewEmail = `smoke-crew-${stamp}@example.com`
const employerEmail = `smoke-employer-${stamp}@example.com`
const password = 'TestPass123!'

let failures = 0
function check(label, condition, extra = '') {
  if (condition) console.log(`  PASS ${label}`)
  else {
    failures++
    console.error(`  FAIL ${label} ${extra}`)
  }
}

// In-memory cookie jar mirroring the browser client's storage.
function makeJarClient() {
  let jar = []
  const client = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => jar,
      setAll: (cookiesToSet) => {
        jar = cookiesToSet.map(({ name, value }) => ({ name, value }))
      },
    },
  })
  return {
    client,
    cookieHeader: () => jar.map(({ name, value }) => `${name}=${encodeURIComponent(value)}`).join('; '),
  }
}

async function api(path, { method = 'GET', body, cookieHeader } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  })
  let json = null
  const text = await res.text()
  try { json = JSON.parse(text) } catch {}
  return { status: res.status, json, text }
}

async function cleanup() {
  await admin.from('users').delete().in('email', [crewEmail, employerEmail])
  const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 200 })
  for (const u of authUsers?.users ?? []) {
    if (u.email === crewEmail || u.email === employerEmail) {
      await admin.auth.admin.deleteUser(u.id)
    }
  }
}

async function main() {
  console.log(`Smoke test against ${BASE} (Supabase ${url})`)

  // ---------- 1. sign-up ----------
  console.log('\n1. Sign-up')
  const crewReg = await api('/api/auth/register/crew', {
    method: 'POST',
    body: { name: 'Smoke Crew', email: crewEmail, password },
  })
  check('crew registration returns 201', crewReg.status === 201, `got ${crewReg.status}: ${crewReg.text?.slice(0, 200)}`)

  const employerReg = await api('/api/auth/register/employer', {
    method: 'POST',
    body: { name: 'Smoke Employer', email: employerEmail, password, companyName: 'Smoke Films' },
  })
  check('employer registration returns 201', employerReg.status === 201, `got ${employerReg.status}: ${employerReg.text?.slice(0, 200)}`)

  // Trigger 0005 provisions the public.users + profile rows.
  const { data: crewUser } = await admin.from('users').select('id, role').eq('email', crewEmail).maybeSingle()
  check('crew public.users row provisioned', Boolean(crewUser), 'no users row for crew')
  const { data: employerUser } = await admin.from('users').select('id, role').eq('email', employerEmail).maybeSingle()
  check('employer public.users row provisioned', Boolean(employerUser), 'no users row for employer')
  if (!crewUser || !employerUser) return finish()

  const { data: crewProfile } = await admin.from('crew_profiles').select('id').eq('userId', crewUser.id).maybeSingle()
  check('crew_profiles row provisioned', Boolean(crewProfile))
  const { data: employerProfile } = await admin.from('employer_profiles').select('id').eq('userId', employerUser.id).maybeSingle()
  check('employer_profiles row provisioned', Boolean(employerProfile))
  if (!crewProfile || !employerProfile) return finish()

  // ---------- 2. email confirm + sign-in ----------
  console.log('\n2. Email confirmation + sign-in')
  const { data: authList } = await admin.auth.admin.listUsers({ perPage: 200 })
  for (const u of authList?.users ?? []) {
    if (u.email === crewEmail || u.email === employerEmail) {
      if (!u.email_confirmed_at) await admin.auth.admin.updateUserById(u.id, { email_confirm: true })
    }
  }

  const crewJar = makeJarClient()
  const crewSignIn = await crewJar.client.auth.signInWithPassword({ email: crewEmail, password })
  check('crew sign-in succeeds', !crewSignIn.error, crewSignIn.error?.message)
  const employerJar = makeJarClient()
  const employerSignIn = await employerJar.client.auth.signInWithPassword({ email: employerEmail, password })
  check('employer sign-in succeeds', !employerSignIn.error, employerSignIn.error?.message)

  const session = await api('/api/auth/session', { cookieHeader: crewJar.cookieHeader() })
  check('session endpoint returns crew role', session.json?.user?.role === 'CREW', JSON.stringify(session.json)?.slice(0, 200))
  if (crewSignIn.error || employerSignIn.error) return finish()

  // ---------- 3. profile update ----------
  console.log('\n3. Profile update')
  const profilePatch = await api(`/api/crew/profile`, {
    method: 'POST',
    cookieHeader: crewJar.cookieHeader(),
    body: { userId: crewUser.id, city: 'Mumbai', yearsExperience: '5', primaryRoles: ['CAMERA'] },
  })
  // 200/201 both acceptable; some fields may require the full wizard.
  check('crew profile update accepted', [200, 201].includes(profilePatch.status), `got ${profilePatch.status}: ${profilePatch.text?.slice(0, 200)}`)

  // ---------- 4. employer posts a project; crew applies ----------
  console.log('\n4. Project post + application')
  const postProject = await api('/api/employer/projects', {
    method: 'POST',
    cookieHeader: employerJar.cookieHeader(),
    body: {
      projectName: `Smoke Project ${stamp}`,
      projectType: 'Feature',
      rolesNeeded: ['CAMERA'],
      shootStartDate: '2026-10-01',
      shootEndDate: '2026-11-01',
      location: 'Mumbai',
      description: 'Smoke test project.',
      questions: ['Why do you want this role?'],
      contactPreference: ['EMAIL'],
    },
  })
  check('employer project post returns 2xx', postProject.status >= 200 && postProject.status < 300, `got ${postProject.status}: ${postProject.text?.slice(0, 200)}`)
  const projectId = postProject.json?.project?.id ?? postProject.json?.id
  if (!projectId) {
    check('project id returned', false, JSON.stringify(postProject.json)?.slice(0, 300))
    return finish()
  }

  const apply = await api(`/api/projects/${projectId}/apply`, {
    method: 'POST',
    cookieHeader: crewJar.cookieHeader(),
    body: { answers: ['Because I love film.'], notes: 'Smoke application.' },
  })
  check('crew application accepted', [200, 201].includes(apply.status), `got ${apply.status}: ${apply.text?.slice(0, 200)}`)

  const { data: application } = await admin.from('applications')
    .select('id, status, crew_id, project_id')
    .eq('project_id', projectId)
    .maybeSingle()
  check('application row exists', Boolean(application))

  // ---------- 5. subscriptions ----------
  console.log('\n5. Subscription plans + manage')
  const plans = await api('/api/subscriptions/plans', { cookieHeader: crewJar.cookieHeader() })
  check('plans endpoint returns 200 with plans', plans.status === 200 && Array.isArray(plans.json?.plans) && plans.json.plans.length > 0, `got ${plans.status}`)
  const planId = plans.json?.plans?.[0]?.id

  const manage = await api('/api/subscriptions/manage', { cookieHeader: crewJar.cookieHeader() })
  check('manage endpoint returns 200', manage.status === 200, `got ${manage.status}`)
  const subBefore = manage.json?.subscription
  if (planId && !subBefore) {
    const subscribe = await api('/api/subscriptions/create', {
      method: 'POST',
      cookieHeader: crewJar.cookieHeader(),
      body: { planId },
    })
    check('subscription create returns 2xx (Razorpay path)', subscribe.status >= 200 && subscribe.status < 300, `got ${subscribe.status}: ${subscribe.text?.slice(0, 200)}`)
    if ([200, 201].includes(subscribe.status)) {
      const { data: subRow } = await admin.from('subscriptions')
        .select('id, plan_id, status, user_id')
        .eq('user_id', crewUser.id)
        .maybeSingle()
      check('subscription row persisted', Boolean(subRow))
    }
  } else {
    check('subscription create (already subscribed — Razorpay skipped)', true)
  }

  return finish()
}

async function finish() {
  await cleanup()
  console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch(async (err) => {
  console.error('Smoke test crashed:', err)
  await cleanup()
  process.exit(1)
})
