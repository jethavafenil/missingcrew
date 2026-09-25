import { describe, expect, it } from 'vitest'
import {
  mapUser,
  mapCrewProfile,
  mapProject,
  mapSubscription,
  mapSubscriptionPlan,
  mapConnection,
  asBool,
  asDate,
  asStringList,
} from '@/lib/repo/types'

describe('row mappers (snake_case → camelCase, Prisma-era shapes)', () => {
  it('mapUser reads quoted camelCase columns and coerces timestamps', () => {
    const u = mapUser({
      id: 'u1', auth_id: 'auth-1', name: 'Ada', email: 'ada@example.com',
      email_verified: '2026-01-01T00:00:00.000Z', phone: null, phoneVerified: true,
      role: 'CREW', created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-02T00:00:00.000Z',
    })
    expect(u.id).toBe('u1')
    expect(u.authId).toBe('auth-1')
    expect(u.emailVerified).toBeInstanceOf(Date)
    expect(u.phoneVerified).toBe(true)
    expect(u.role).toBe('CREW')
  })

  it('mapProject maps jsonb arrays and dates', () => {
    const p = mapProject({
      id: 'p1', employer_id: 'e1', project_name: 'Film', project_type: 'Feature',
      roles_needed: ['Director', 'Camera'], shoot_start_date: '2026-02-01',
      shoot_end_date: '2026-03-01', location: 'Mumbai', budget_per_role: null,
      description: 'A film', questions: { q1: 'Why?' }, contact_preference: ['EMAIL'],
      status: 'OPEN', created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z',
    })
    expect(p.employerId).toBe('e1')
    expect(p.rolesNeeded).toEqual(['Director', 'Camera'])
    expect(p.shootStartDate).toBeInstanceOf(Date)
    expect(p.questions).toEqual({ q1: 'Why?' })
    expect(p.status).toBe('OPEN')
  })

  it('mapProject tolerates jsonb columns delivered as JSON strings', () => {
    const p = mapProject({
      id: 'p2', employer_id: 'e1', project_name: 'X', project_type: 'Ad',
      roles_needed: '["Editor"]', shoot_start_date: '2026-02-01', shoot_end_date: '2026-03-01',
      location: 'Pune', description: 'd', questions: '{"q":"a"}', contact_preference: '["EMAIL"]',
      status: 'OPEN', created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z',
    })
    expect(p.rolesNeeded).toEqual(['Editor'])
    expect(p.questions).toEqual({ q: 'a' })
  })

  it('mapCrewProfile maps budget/availability fields', () => {
    const c = mapCrewProfile({
      id: 'c1', userId: 'u1', photo: null, city: 'Mumbai',
      budget_range_min: 5000, budget_range_max: 10000, budgetFlexible: false,
      primary_roles: '["Camera"]', years_experience: '5', location: 'Mumbai',
      available_to_travel: true, availability: false, availability_start: null, availability_end: null,
      project_types: ['Ad'], daily_budget_min: 1000, daily_budget_max: 2000, languages: ['en'],
      imdb_link: null, portfolio_links: '["https://x.example"]', past_projects: null,
      referred_by: null, contact_whatsapp: null, terms_agreed: true,
      subscription_tier: 'FREE_TRIAL', trial_ends: null, completed: false,
      created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z',
    })
    expect(c.budgetRangeMin).toBe(5000)
    expect(c.primaryRoles).toEqual(['Camera'])
    expect(c.availableToTravel).toBe(true)
    expect(c.portfolioLinks).toEqual(['https://x.example'])
    expect(c.subscriptionTier).toBe('FREE_TRIAL')
  })

  it('mapSubscription keeps provider columns distinct', () => {
    const s = mapSubscription({
      id: 's1', userId: 'u1', plan_id: 'pro', status: 'ACTIVE',
      razorpay_subscription_id: null, razorpay_payment_id: null,
      stripe_customer_id: 'cus_1', stripe_subscription_id: 'sub_1', stripe_price_id: 'price_1',
      current_period_start: '2026-01-01', current_period_end: '2026-02-01',
      created_at: '2026-01-01', updated_at: '2026-01-01',
    })
    expect(s.planId).toBe('pro')
    expect(s.stripeCustomerId).toBe('cus_1')
    expect(s.razorpaySubscriptionId).toBeNull()
  })

  it('mapSubscriptionPlan parses features jsonb', () => {
    const plan = mapSubscriptionPlan({
      id: 'basic', name: 'Basic', price: 499, description: 'd',
      features: '["a","b"]', stripe_price_id: 'price_b',
      created_at: '2026-01-01', updated_at: '2026-01-01',
    })
    expect(plan.features).toEqual(['a', 'b'])
    expect(plan.price).toBe(499)
  })

  it('mapConnection maps request/receiver ids', () => {
    const c = mapConnection({
      id: 'cn1', requester_id: 'u1', receiver_id: 'u2', status: 'PENDING',
      created_at: '2026-01-01', updated_at: '2026-01-01',
    })
    expect(c.requesterId).toBe('u1')
    expect(c.status).toBe('PENDING')
  })
})

describe('coercion helpers', () => {
  it('asBool accepts true/"true"/1/"1" only', () => {
    expect(asBool(true)).toBe(true)
    expect(asBool('true')).toBe(true)
    expect(asBool(1)).toBe(true)
    expect(asBool('1')).toBe(true)
    expect(asBool(false)).toBe(false)
    expect(asBool(0)).toBe(false)
    expect(asBool('yes')).toBe(false)
    expect(asBool(null)).toBe(false)
  })

  it('asDate passes Date through, parses strings, nulls on null', () => {
    const d = new Date()
    expect(asDate(d)).toBe(d)
    expect(asDate('2026-09-09T00:00:00.000Z')).toBeInstanceOf(Date)
    expect(asDate(null)).toBeNull()
  })

  it('asStringList parses JSON strings and returns [] for junk', () => {
    expect(asStringList('["a"]')).toEqual(['a'])
    expect(asStringList(['a'])).toEqual(['a'])
    expect(asStringList('not-json')).toEqual([])
    expect(asStringList(null)).toEqual([])
    expect(asStringList('{"not":"array"}')).toEqual([])
  })

  it('asJsonObj behavior is covered via mapProject questions (unexported helper)', () => {
    // questions uses the same coercion: JSON string → object, junk → {}
    expect(mapProject(rawProject({ questions: '{"a":1}' })).questions).toEqual({ a: 1 })
    expect(mapProject(rawProject({ questions: 'bad' })).questions).toEqual({})
    expect(mapProject(rawProject({ questions: null })).questions).toEqual({})
  })
})

function rawProject(overrides: Record<string, unknown>) {
  return {
    id: 'p', employer_id: 'e', project_name: 'N', project_type: 'T',
    roles_needed: '[]', shoot_start_date: '2026-01-01', shoot_end_date: '2026-01-02',
    location: 'L', description: 'D', contact_preference: '[]', status: 'OPEN',
    created_at: '2026-01-01', updated_at: '2026-01-01',
    ...overrides,
  }
}
