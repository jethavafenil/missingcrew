/**
 * Activate a subscription that was paid but shows as CANCELED
 */

require('dotenv').config()
const Stripe = require('stripe')
const { getSupabaseServiceClient, unwrap, iso } = require('./lib/supabase')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
})

const supabase = getSupabaseServiceClient()

async function main() {
  const email = process.argv[2]

  if (!email) {
    console.log('Usage: node scripts/activate-subscription.js <email>')
    process.exit(1)
  }

  console.log(`🔄 Activating subscription for: ${email}\n`)

  try {
    // Get user from database
    const user = unwrap('user.findUnique',
      await supabase.from('users').select('*').eq('email', email).maybeSingle())

    if (!user) {
      console.error('❌ User not found in database')
      process.exit(1)
    }

    console.log(`✅ User: ${user.name || user.email}`)

    // Get active subscription from Stripe
    const customers = await stripe.customers.list({
      email: email,
      limit: 1
    })

    if (customers.data.length === 0) {
      console.error('❌ No Stripe customer found')
      process.exit(1)
    }

    const customer = customers.data[0]
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1
    })

    if (subscriptions.data.length === 0) {
      console.error('❌ No active subscription in Stripe')
      process.exit(1)
    }

    const stripeSub = subscriptions.data[0]
    console.log(`✅ Active Stripe subscription: ${stripeSub.id}`)
    console.log(`   Status: ${stripeSub.status}`)

    // Get current period dates
    const currentPeriodStart = stripeSub.current_period_start
      ? new Date(stripeSub.current_period_start * 1000)
      : new Date()

    const currentPeriodEnd = stripeSub.current_period_end
      ? new Date(stripeSub.current_period_end * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    // Update database subscription to ACTIVE
    const dbSub = unwrap('subscription.update',
      await supabase
        .from('subscriptions')
        .update({
          status: 'ACTIVE',
          stripe_subscription_id: stripeSub.id,
          current_period_start: iso(currentPeriodStart),
          current_period_end: iso(currentPeriodEnd),
          updated_at: new Date().toISOString(),
        })
        .eq('userId', user.id)
        .select('*,plan:subscription_plans(*)')
        .single())

    console.log(`\n✅ Updated database subscription to ACTIVE`)
    console.log(`   Plan: ${dbSub.plan.name}`)
    console.log(`   Period: ${currentPeriodStart.toISOString().split('T')[0]} to ${currentPeriodEnd.toISOString().split('T')[0]}`)

    // Update crew profile tier
    const tier = dbSub.plan.name === 'Pro Profile' ? 'PRO' : 'BASIC'
    unwrap('crewProfile.update',
      await supabase
        .from('crew_profiles')
        .update({
          subscription_tier: tier,
          updated_at: new Date().toISOString(),
        })
        .eq('userId', user.id)
        .select('id')
        .single())

    console.log(`✅ Updated crew profile tier to: ${tier}`)
    console.log(`\n✨ Done! Refresh your dashboard to see the changes.`)

  } catch (error) {
    console.error('\n❌ Error:', error.message)
  }
}

main()
