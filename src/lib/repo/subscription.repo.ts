import { getServiceClient } from '@/lib/repo/client'
import { now, throwOnError, iso } from '@/lib/repo/helpers'
import {
  mapSubscriptionPlan,
  mapSubscription,
  type SubscriptionPlanRow,
  type SubscriptionRow,
  type SubscriptionWithPlanRow,
  type SubscriptionStatus,
} from '@/lib/repo/types'
import type { Requester } from '@/lib/repo/types'

export const PLAN_COLS = 'id,name,price,description,features,stripe_price_id,created_at,updated_at'
export const SUB_COLS =
  'id,"userId",plan_id,status,razorpay_subscription_id,razorpay_payment_id,stripe_customer_id,stripe_subscription_id,stripe_price_id,current_period_start,current_period_end,created_at,updated_at'

const PLAN_EMBED = 'plan:subscription_plans(id,name,price,description,features,stripe_price_id,created_at,updated_at)'
const SUB_WITH_PLAN = `${SUB_COLS},${PLAN_EMBED}`

export async function findPlanById(id: string): Promise<SubscriptionPlanRow | null> {
  const { data, error } = await getServiceClient().from('subscription_plans').select(PLAN_COLS).eq('id', id).maybeSingle()
  throwOnError('subscriptionPlan.findById', error)
  return data ? mapSubscriptionPlan(data as Record<string, unknown>) : null
}

export async function findPlanByStripePriceId(stripePriceId: string): Promise<SubscriptionPlanRow | null> {
  const { data, error } = await getServiceClient()
    .from('subscription_plans')
    .select(PLAN_COLS)
    .eq('stripe_price_id', stripePriceId)
    .maybeSingle()
  throwOnError('subscriptionPlan.findByStripePriceId', error)
  return data ? mapSubscriptionPlan(data as Record<string, unknown>) : null
}

// Fallback lookup by monthly amount (verify-session): prices are unique per
// plan, but use limit(1) rather than maybeSingle to avoid an error if the
// constraint is ever violated.
export async function findPlanByPrice(price: number): Promise<SubscriptionPlanRow | null> {
  const { data, error } = await getServiceClient()
    .from('subscription_plans')
    .select(PLAN_COLS)
    .eq('price', price)
    .limit(1)
  throwOnError('subscriptionPlan.findByPrice', error)
  return data?.length ? mapSubscriptionPlan(data[0] as Record<string, unknown>) : null
}

export async function findPlans(): Promise<SubscriptionPlanRow[]> {
  const { data, error } = await getServiceClient().from('subscription_plans').select(PLAN_COLS).order('price', { ascending: true })
  throwOnError('subscriptionPlan.findPlans', error)
  return (data ?? []).map((r) => mapSubscriptionPlan(r as Record<string, unknown>))
}

export interface CreatePlanInput {
  name: string
  price: number
  description: string
  features: string[]
  stripePriceId?: string | null
}

export async function createPlan(input: CreatePlanInput, _req: Requester & { role: 'ADMIN' }): Promise<SubscriptionPlanRow> {
  const { data, error } = await getServiceClient()
    .from('subscription_plans')
    .insert({
      name: input.name,
      price: input.price,
      description: input.description,
      features: input.features,
      stripe_price_id: input.stripePriceId ?? null,
      created_at: now().toISOString(),
      updated_at: now().toISOString(),
    })
    .select(PLAN_COLS)
    .single()
  throwOnError('subscriptionPlan.create', error)
  return mapSubscriptionPlan(data as Record<string, unknown>)
}

export interface UpdatePlanInput {
  name?: string
  price?: number
  description?: string
  features?: string[]
  stripePriceId?: string | null
}

export async function updatePlan(id: string, input: UpdatePlanInput, _req: Requester & { role: 'ADMIN' }): Promise<SubscriptionPlanRow | null> {
  const patch: Record<string, unknown> = { updated_at: now().toISOString() }
  if (input.name !== undefined) patch.name = input.name
  if (input.price !== undefined) patch.price = input.price
  if (input.description !== undefined) patch.description = input.description
  if (input.features !== undefined) patch.features = input.features
  if (input.stripePriceId !== undefined) patch.stripe_price_id = input.stripePriceId
  const { data, error } = await getServiceClient().from('subscription_plans').update(patch).eq('id', id).select(PLAN_COLS).maybeSingle()
  throwOnError('subscriptionPlan.update', error)
  return data ? mapSubscriptionPlan(data as Record<string, unknown>) : null
}

export async function findByUserId(userId: string, _req: Requester): Promise<SubscriptionWithPlanRow | null> {
  const { data, error } = await getServiceClient().from('subscriptions').select(SUB_WITH_PLAN).eq('userId', userId).maybeSingle()
  throwOnError('subscription.findByUserId', error)
  if (!data) return null
  const s = mapSubscription(data as Record<string, unknown>)
  const planRaw = (data as Record<string, unknown>).plan as Record<string, unknown> | null | undefined
  return { ...s, plan: planRaw ? mapSubscriptionPlan(planRaw) : undefined }
}

export async function findById(id: string, _req: Requester): Promise<SubscriptionWithPlanRow | null> {
  const { data, error } = await getServiceClient().from('subscriptions').select(SUB_WITH_PLAN).eq('id', id).maybeSingle()
  throwOnError('subscription.findById', error)
  if (!data) return null
  const s = mapSubscription(data as Record<string, unknown>)
  const planRaw = (data as Record<string, unknown>).plan as Record<string, unknown> | null | undefined
  return { ...s, plan: planRaw ? mapSubscriptionPlan(planRaw) : undefined }
}

export async function findByRazorpaySubscriptionId(razorpaySubscriptionId: string): Promise<SubscriptionWithPlanRow | null> {
  const { data, error } = await getServiceClient().from('subscriptions').select(SUB_WITH_PLAN).eq('razorpay_subscription_id', razorpaySubscriptionId).maybeSingle()
  throwOnError('subscription.findByRazorpaySubscriptionId', error)
  if (!data) return null
  const s = mapSubscription(data as Record<string, unknown>)
  const planRaw = (data as Record<string, unknown>).plan as Record<string, unknown> | null | undefined
  return { ...s, plan: planRaw ? mapSubscriptionPlan(planRaw) : undefined }
}

export async function findManyAdmin(_req: Requester & { role: 'ADMIN' }): Promise<Array<SubscriptionWithPlanRow & { user?: unknown }>> {
  const { data, error } = await getServiceClient()
    .from('subscriptions')
    .select(`${SUB_WITH_PLAN},user:users(id,name,email)`)
    .order('created_at', { ascending: false })
  throwOnError('subscription.findManyAdmin', error)
  return (data ?? []).map((r) => {
    const raw = r as Record<string, unknown>
    const s = mapSubscription(raw)
    const planRaw = raw.plan as Record<string, unknown> | null | undefined
    const userRaw = raw.user as Record<string, unknown> | null | undefined
    return {
      ...s,
      plan: planRaw ? mapSubscriptionPlan(planRaw) : undefined,
      user: userRaw ? { id: userRaw.id, name: userRaw.name, email: userRaw.email } : undefined,
    }
  })
}

export interface SubscriptionInput {
  planId: string
  status?: SubscriptionStatus
  razorpaySubscriptionId?: string | null
  razorpayPaymentId?: string | null
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
  stripePriceId?: string | null
  currentPeriodStart: Date | string
  currentPeriodEnd: Date | string
}

export async function upsertByUserId(userId: string, input: SubscriptionInput, _req: Requester): Promise<SubscriptionRow> {
  const existing = await findByUserId(userId, _req)
  if (!existing) {
    return create(userId, input, _req)
  }
  const patch: Record<string, unknown> = { updated_at: now().toISOString() }
  const assign = (key: string, val: unknown) => { if (val !== undefined) patch[key] = val }
  assign('plan_id', input.planId)
  assign('status', input.status)
  assign('razorpay_subscription_id', input.razorpaySubscriptionId ?? null)
  assign('razorpay_payment_id', input.razorpayPaymentId ?? null)
  assign('stripe_customer_id', input.stripeCustomerId ?? null)
  assign('stripe_subscription_id', input.stripeSubscriptionId ?? null)
  assign('stripe_price_id', input.stripePriceId ?? null)
  assign('current_period_start', iso(input.currentPeriodStart))
  assign('current_period_end', iso(input.currentPeriodEnd))
  const { data, error } = await getServiceClient().from('subscriptions').update(patch).eq('id', existing.id).select(SUB_COLS).single()
  throwOnError('subscription.upsertByUserId', error)
  return mapSubscription(data as Record<string, unknown>)
}

export async function create(userId: string, input: SubscriptionInput, _req: Requester): Promise<SubscriptionRow> {
  const { data, error } = await getServiceClient()
    .from('subscriptions')
    .insert({
      userId,
      plan_id: input.planId,
      status: input.status ?? 'ACTIVE',
      razorpay_subscription_id: input.razorpaySubscriptionId ?? null,
      razorpay_payment_id: input.razorpayPaymentId ?? null,
      stripe_customer_id: input.stripeCustomerId ?? null,
      stripe_subscription_id: input.stripeSubscriptionId ?? null,
      stripe_price_id: input.stripePriceId ?? null,
      current_period_start: iso(input.currentPeriodStart),
      current_period_end: iso(input.currentPeriodEnd),
      created_at: now().toISOString(),
      updated_at: now().toISOString(),
    })
    .select(SUB_COLS)
    .single()
  throwOnError('subscription.create', error)
  return mapSubscription(data as Record<string, unknown>)
}

export async function update(id: string, input: Partial<SubscriptionInput>, _req: Requester): Promise<SubscriptionRow | null> {
  const patch: Record<string, unknown> = { updated_at: now().toISOString() }
  const assign = (key: string, val: unknown) => { if (val !== undefined) patch[key] = val }
  assign('plan_id', input.planId)
  assign('status', input.status)
  assign('razorpay_subscription_id', input.razorpaySubscriptionId)
  assign('razorpay_payment_id', input.razorpayPaymentId)
  assign('stripe_customer_id', input.stripeCustomerId)
  assign('stripe_subscription_id', input.stripeSubscriptionId)
  assign('stripe_price_id', input.stripePriceId)
  assign('current_period_start', input.currentPeriodStart !== undefined ? iso(input.currentPeriodStart) : undefined)
  assign('current_period_end', input.currentPeriodEnd !== undefined ? iso(input.currentPeriodEnd) : undefined)
  const { data, error } = await getServiceClient().from('subscriptions').update(patch).eq('id', id).select(SUB_COLS).maybeSingle()
  throwOnError('subscription.update', error)
  return data ? mapSubscription(data as Record<string, unknown>) : null
}

export async function findByStripeCustomerId(stripeCustomerId: string): Promise<SubscriptionWithPlanRow | null> {
  const { data, error } = await getServiceClient().from('subscriptions').select(SUB_WITH_PLAN).eq('stripe_customer_id', stripeCustomerId).maybeSingle()
  throwOnError('subscription.findByStripeCustomerId', error)
  if (!data) return null
  const s = mapSubscription(data as Record<string, unknown>)
  const planRaw = (data as Record<string, unknown>).plan as Record<string, unknown> | null | undefined
  return { ...s, plan: planRaw ? mapSubscriptionPlan(planRaw) : undefined }
}

export async function findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<SubscriptionWithPlanRow | null> {
  const { data, error } = await getServiceClient().from('subscriptions').select(SUB_WITH_PLAN).eq('stripe_subscription_id', stripeSubscriptionId).maybeSingle()
  throwOnError('subscription.findByStripeSubscriptionId', error)
  if (!data) return null
  const s = mapSubscription(data as Record<string, unknown>)
  const planRaw = (data as Record<string, unknown>).plan as Record<string, unknown> | null | undefined
  return { ...s, plan: planRaw ? mapSubscriptionPlan(planRaw) : undefined }
}

export async function countAll(_req: Requester): Promise<number> {
  const { count, error } = await getServiceClient().from('subscriptions').select('id', { count: 'exact', head: true })
  throwOnError('subscription.count', error)
  return count ?? 0
}

export async function countByStatus(status: SubscriptionStatus, _req: Requester): Promise<number> {
  const { count, error } = await getServiceClient()
    .from('subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('status', status)
  throwOnError('subscription.countByStatus', error)
  return count ?? 0
}

export type { SubscriptionPlanRow, SubscriptionRow, SubscriptionWithPlanRow, SubscriptionStatus }