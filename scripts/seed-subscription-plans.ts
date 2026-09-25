/**
 * Seed Subscription Plans
 * Resets the subscription_plans table and creates the Basic/Pro plans.
 *
 * Usage: npx tsx scripts/seed-subscription-plans.ts
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (check your .env)')
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PLANS = [
  {
    name: 'Basic Profile',
    price: 199,
    description: 'Basic subscription plan for crew members',
    features: [
      'Appear in crew search',
      'Apply to 10 gigs/month',
      'Show availability status',
      '2 Portfolio links',
      'Basic profile visibility'
    ]
  },
  {
    name: 'Pro Profile',
    price: 399,
    description: 'Premium subscription plan for crew members',
    features: [
      'Unlimited job applications',
      'Appear higher in employer search',
      'Verified badge',
      '5 portfolio links',
      'Featured in "Recommended Crew"',
      'Priority support'
    ]
  }
]

async function main() {
  const now = new Date().toISOString()

  // Delete existing plans
  const { error: deleteError } = await supabase.from('subscription_plans').delete()
  if (deleteError) throw new Error(`subscriptionPlan.deleteMany: ${deleteError.message}`)

  // Create plans
  for (const plan of PLANS) {
    const { error } = await supabase.from('subscription_plans').insert({
      name: plan.name,
      price: plan.price,
      description: plan.description,
      features: plan.features,
      created_at: now,
      updated_at: now,
    })
    if (error) throw new Error(`subscriptionPlan.create: ${error.message}`)
  }

  console.log('Subscription plans seeded successfully!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
