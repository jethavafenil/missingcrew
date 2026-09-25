// P5.3 integration test: verifies the on_auth_user_created trigger provisions
// public.users + the role-correct placeholder profile on signup, and that the
// custom access token hook injects `role` into the JWT.
//
// Run: node scripts/test-auth-provisioning.mjs
// Targets the project configured in .env.local. Creates and deletes two
// throwaway users (test-provision-crew-<ts>@example.com, ...employer-...).

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !serviceKey || !anonKey) {
  console.error('Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
  process.exit(1)
}

const admin = createClient(url, serviceKey)
const anon = createClient(url, anonKey)

const stamp = Date.now()
const crewEmail = `test-provision-crew-${stamp}@example.com`
const employerEmail = `test-provision-employer-${stamp}@example.com`
const password = 'TestPass123!'

let failures = 0

function check(label, condition, extra = '') {
  if (condition) {
    console.log(`  PASS ${label}`)
  } else {
    failures++
    console.error(`  FAIL ${label} ${extra}`)
  }
}

async function cleanup() {
  for (const table of ['users']) {
    await admin.from(table).delete().in('email', [crewEmail, employerEmail])
  }
  const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 200 })
  for (const u of authUsers?.users ?? []) {
    if (u.email === crewEmail || u.email === employerEmail) {
      await admin.auth.admin.deleteUser(u.id)
    }
  }
}

try {
  console.log(`Target: ${url}`)

  // --- CREW signup ---
  console.log('\n1) CREW signup via admin.createUser')
  const { data: crew, error: crewErr } = await admin.auth.admin.createUser({
    email: crewEmail,
    password,
    email_confirm: true,
    user_metadata: { name: 'Test Crew', role: 'CREW' },
    app_metadata: { role: 'CREW' },
  })
  if (crewErr) throw new Error(`createUser(CREW) failed: ${crewErr.message}`)

  const { data: crewRow } = await admin
    .from('users')
    .select('id, auth_id, name, email, role, email_verified, crew_profiles(id), employer_profiles(id)')
    .eq('email', crewEmail)
    .maybeSingle()
  check('public.users row created', !!crewRow)
  check('auth_id linked', crewRow?.auth_id === crew.user?.id)
  check('role is CREW', crewRow?.role === 'CREW', `(got ${crewRow?.role})`)
  check('email_verified set from email_confirmed_at', !!crewRow?.email_verified)
  check('name from user_metadata', crewRow?.name === 'Test Crew')
  check('crew profile placeholder created', (crewRow?.crew_profiles ?? []).length === 1)
  check('no employer profile', (crewRow?.employer_profiles ?? []).length === 0)

  // --- EMPLOYER signup ---
  console.log('\n2) EMPLOYER signup via admin.createUser')
  const { data: employer, error: employerErr } = await admin.auth.admin.createUser({
    email: employerEmail,
    password,
    email_confirm: true,
    user_metadata: { name: 'Test Employer', role: 'EMPLOYER' },
    app_metadata: { role: 'EMPLOYER' },
  })
  if (employerErr) throw new Error(`createUser(EMPLOYER) failed: ${employerErr.message}`)

  const { data: employerRow } = await admin
    .from('users')
    .select('id, auth_id, role, crew_profiles(id), employer_profiles(id, company_name)')
    .eq('email', employerEmail)
    .maybeSingle()
  check('public.users row created', !!employerRow)
  check('auth_id linked', employerRow?.auth_id === employer.user?.id)
  check('role is EMPLOYER', employerRow?.role === 'EMPLOYER', `(got ${employerRow?.role})`)
  check('employer profile placeholder created', (employerRow?.employer_profiles ?? []).length === 1)
  check('no crew profile', (employerRow?.crew_profiles ?? []).length === 0)

  // --- JWT role claim ---
  console.log('\n3) JWT role claim (custom_access_token_hook)')
  const { data: crewLogin, error: crewLoginErr } = await anon.auth.signInWithPassword({
    email: crewEmail,
    password,
  })
  check('crew can sign in', !crewLoginErr && !!crewLogin?.session, crewLoginErr?.message ?? '')
  if (crewLogin?.session) {
    const claims = JSON.parse(Buffer.from(crewLogin.session.access_token.split('.')[1], 'base64url').toString())
    check('JWT claim role=CREW', claims.role === 'CREW', `(got ${claims.role})`)
  }

  const { data: employerLogin, error: employerLoginErr } = await anon.auth.signInWithPassword({
    email: employerEmail,
    password,
  })
  check('employer can sign in', !employerLoginErr && !!employerLogin?.session, employerLoginErr?.message ?? '')
  if (employerLogin?.session) {
    const claims = JSON.parse(Buffer.from(employerLogin.session.access_token.split('.')[1], 'base64url').toString())
    check('JWT claim role=EMPLOYER', claims.role === 'EMPLOYER', `(got ${claims.role})`)
  }

  console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`)
} finally {
  await cleanup()
  process.exit(failures === 0 ? 0 : 1)
}
