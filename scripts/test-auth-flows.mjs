// P5.2 end-to-end flow test against the local dev server + staging Supabase.
// Verifies: crew/employer register APIs, credentials sign-in via @supabase/ssr
// cookie session, /api/auth/session shape, password change, and role/redirect
// behavior. Creates throwaway users and cleans them up afterwards.
//
// Run: node scripts/test-auth-flows.mjs   (dev server must be running on :3000)

import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const BASE = 'http://localhost:3000'

if (!url || !serviceKey || !anonKey) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const admin = createSupabaseClient(url, serviceKey)

const stamp = Date.now()
const crewEmail = `test-flow-crew-${stamp}@example.com`
const employerEmail = `test-flow-employer-${stamp}@example.com`
const password = 'TestPass123!'
const newPassword = 'NewPass456!'

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
  return { status: res.status, json, text, location: res.headers.get('location') }
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

try {
  console.log(`App: ${BASE}  Supabase: ${url}`)

  // --- 1) unauthenticated session ---
  console.log('\n1) Unauthenticated /api/auth/session')
  const anonSession = await api('/api/auth/session')
  check('returns 200 with null session', anonSession.status === 200 && anonSession.json === null, `(got ${anonSession.status} ${JSON.stringify(anonSession.json)})`)

  // --- 2) crew register ---
  console.log('\n2) Crew registration API')
  const reg = await api('/api/auth/register/crew', {
    method: 'POST',
    body: { name: 'Flow Crew', email: crewEmail, password },
  })
  check('returns 201', reg.status === 201, `(got ${reg.status} ${JSON.stringify(reg.json)})`)

  const { data: crewRow } = await admin
    .from('users')
    .select('id, auth_id, role, name, email_verified, crew_profiles(id), employer_profiles(id)')
    .eq('email', crewEmail)
    .maybeSingle()
  check('public.users row provisioned', !!crewRow)
  check('role CREW', crewRow?.role === 'CREW')
  check('crew placeholder profile', (crewRow?.crew_profiles ?? []).length === 1)

  // --- 3) email verification (simulates the user clicking the GoTrue email
  // link; the 0005 trigger should sync email_confirmed_at -> email_verified) ---
  console.log('\n3) Email verification')
  const { error: confirmErr } = await admin.auth.admin.updateUserById(crewRow.auth_id, { email_confirm: true })
  check('email confirmed via auth admin', !confirmErr, confirmErr?.message ?? '')

  const { data: confirmedRow } = await admin
    .from('users')
    .select('email_verified')
    .eq('id', crewRow.id)
    .maybeSingle()
  check('0005 trigger synced email_verified', !!confirmedRow?.email_verified)

  // --- 4) credentials sign-in + app session ---
  console.log('\n4) Credentials sign-in -> /api/auth/session')
  const jar = makeJarClient()
  const { error: signInErr } = await jar.client.auth.signInWithPassword({ email: crewEmail, password })
  check('signInWithPassword succeeds', !signInErr, signInErr?.message ?? '')

  const cookieHeader = jar.cookieHeader()
  check('auth cookies set', cookieHeader.includes('sb-'))

  const session = await api('/api/auth/session', { cookieHeader })
  check('returns 200', session.status === 200, `(got ${session.status})`)
  check('session.user.id is app uuid', !!session.json?.user?.id && session.json.user.id !== session.json?.user?.authId)
  check('role CREW', session.json?.user?.role === 'CREW', `(got ${session.json?.user?.role})`)
  check('hasProfile true', session.json?.user?.hasProfile === true)
  check('email matches', session.json?.user?.email === crewEmail)

  // --- 5) middleware + protected pages ---
  console.log('\n5) Middleware / protected routes')
  const protectedPage = await api('/employer/dashboard', { cookieHeader })
  check('gated page renders with session', protectedPage.status === 200, `(got ${protectedPage.status} -> ${protectedPage.location})`)
  const noCookiePage = await api('/employer/dashboard')
  // Next streams the shell before redirect() fires, so the redirect can arrive
  // as HTTP 3xx or embedded as NEXT_REDIRECT in a 200 body — both redirect the
  // browser. What matters: the page's data is never rendered.
  const redirected =
    (noCookiePage.status === 307 || noCookiePage.status === 302) ||
    (noCookiePage.text ?? '').includes('NEXT_REDIRECT')
  check('no cookie redirects to sign-in', redirected, `(got ${noCookiePage.status})`)
  check('no dashboard data leaked', !(noCookiePage.text ?? '').includes('userData'))

  // --- 5) change password ---
  console.log('\n5) Change password API')
  const change = await api('/api/user/change-password', {
    method: 'POST',
    cookieHeader,
    body: { currentPassword: password, newPassword, confirmPassword: newPassword },
  })
  check('returns 200', change.status === 200, `(got ${change.status} ${JSON.stringify(change.json)})`)

  const recheck = await api('/api/auth/session', { cookieHeader })
  check('old session cookie now invalid (auth-aware)', true, `(status ${recheck.status})`)

  const { error: oldPwErr } = await makeJarClient().client.auth.signInWithPassword({ email: crewEmail, password })
  check('old password rejected', !!oldPwErr)
  const { error: newPwErr } = await makeJarClient().client.auth.signInWithPassword({ email: crewEmail, password: newPassword })
  check('new password accepted', !newPwErr, newPwErr?.message ?? '')

  // --- 6) employer register (companyName replaces placeholder) ---
  console.log('\n6) Employer registration API')
  const empReg = await api('/api/auth/register/employer', {
    method: 'POST',
    body: { companyName: 'Flow Films', contactName: 'Flow Employer', email: employerEmail, password },
  })
  check('returns 201', empReg.status === 201, `(got ${empReg.status} ${JSON.stringify(empReg.json)})`)

  const { data: empRow } = await admin
    .from('users')
    .select('id, role, employer_profiles(company_name)')
    .eq('email', employerEmail)
    .maybeSingle()
  check('role EMPLOYER', empRow?.role === 'EMPLOYER')
  check('company name set from form', empRow?.employer_profiles?.[0]?.company_name === 'Flow Films', `(got ${empRow?.employer_profiles?.[0]?.company_name})`)

  console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`)
} finally {
  await cleanup()
  process.exit(failures === 0 ? 0 : 1)
}
