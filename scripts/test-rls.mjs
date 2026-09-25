import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'

const required = ['RLS_TEST_URL', 'RLS_TEST_ANON_KEY', 'RLS_CREW_A_EMAIL', 'RLS_CREW_A_PASSWORD', 'RLS_CREW_B_EMAIL', 'RLS_CREW_B_PASSWORD', 'RLS_EMPLOYER_A_EMAIL', 'RLS_EMPLOYER_A_PASSWORD', 'RLS_EMPLOYER_B_EMAIL', 'RLS_EMPLOYER_B_PASSWORD']
const missing = required.filter((name) => !process.env[name])
if (missing.length) {
  console.error(`Missing isolated-test credentials: ${missing.join(', ')}`)
  process.exit(2)
}

const url = process.env.RLS_TEST_URL
const key = process.env.RLS_TEST_ANON_KEY
const client = () => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
async function login(email, password) {
  const supabase = client()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  assert.ifError(error)
  return supabase
}

const anon = client()
const crewA = await login(process.env.RLS_CREW_A_EMAIL, process.env.RLS_CREW_A_PASSWORD)
const crewB = await login(process.env.RLS_CREW_B_EMAIL, process.env.RLS_CREW_B_PASSWORD)
const employerA = await login(process.env.RLS_EMPLOYER_A_EMAIL, process.env.RLS_EMPLOYER_A_PASSWORD)
const employerB = await login(process.env.RLS_EMPLOYER_B_EMAIL, process.env.RLS_EMPLOYER_B_PASSWORD)

const [{ data: crewBAuth }, { data: employerBAuth }] = await Promise.all([crewB.auth.getUser(), employerB.auth.getUser()])
const [{ data: crewBUser }, { data: employerBUser }] = await Promise.all([
  crewB.from('users').select('id').eq('auth_id', crewBAuth.user.id).single(),
  employerB.from('users').select('id').eq('auth_id', employerBAuth.user.id).single(),
])
assert.ok(crewBUser?.id && employerBUser?.id)

const { data: foreignCrew } = await crewB.from('crew_profiles').select('id,"userId"').eq('userId', crewBUser.id).single()
assert.ok(foreignCrew?.id)
const forbiddenCrewUpdate = await crewA.from('crew_profiles').update({ city: '__rls_forbidden__' }).eq('id', foreignCrew.id).select('id')
assert.equal(forbiddenCrewUpdate.error, null)
assert.equal(forbiddenCrewUpdate.data?.length, 0, 'crew updated another crew profile')

const foreignSubscription = await employerA.from('subscriptions').select('id').eq('userId', employerBUser.id)
assert.equal(foreignSubscription.error, null)
assert.equal(foreignSubscription.data?.length, 0, 'employer read another employer subscription')

const forbiddenPlan = await crewA.from('subscription_plans').insert({ name: '__rls_forbidden__', price: 1, description: 'test', features: [] }).select('id')
assert.ok(forbiddenPlan.error, 'non-admin created a subscription plan')

for (const table of ['projects', 'crew_profiles']) {
  const read = await anon.from(table).select('id').limit(1)
  assert.equal(read.error, null, `anonymous public read failed for ${table}`)
}
const anonymousWrite = await anon.from('projects').insert({})
assert.ok(anonymousWrite.error, 'anonymous project write was allowed')

console.log('RLS integration assertions passed')
