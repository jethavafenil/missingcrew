/**
 * Import Stripe Subscription to Database
 * Imports the most recent active subscription from Stripe to database
 */

require('dotenv').config()
const Stripe = require('stripe')
const { getSupabaseServiceClient, unwrap, iso } = require('./lib/supabase')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
})
const supabase = getSupabaseServiceClient()

async function main() {
  const userEmail = process.argv[2] || 'hussain31320@gmail.com'

  console.log(`📥 Importing Stripe subscription for: ${userEmail}\n`)

  try {
    // Get user from database
    const user = unwrap('user.findUnique',
      await supabase.from('users').select('*').eq('email', userEmail).maybeSingle())

    if (!user) {
      console.error('❌ User not found in database')
      return
    }

    console.log(`✅ User: ${user.name}`)

    // Get customer from Stripe
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1
    })

    if (customers.data.length === 0) {
      console.error('❌ No Stripe customer found')
      return
    }

    const customer = customers.data[0]
    console.log(`✅ Stripe Customer: ${customer.id}`)

    // Get subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 10
    })

    if (subscriptions.data.length === 0) {
      console.error('❌ No active subscriptions in Stripe')
      return
    }

    // Use the most recent Pro subscription, or the most recent subscription
    let selectedSub = subscriptions.data.find(s =>
      s.items.data[0].price.id === 'price_1SlQZQEHAhv8OPlE6jIR6Frj' // Pro
    )

    if (!selectedSub) {
      selectedSub = subscriptions.data[0] // Use most recent
    }

    console.log(`\n📋 Selected Subscription:`)
    console.log(`   ID: ${selectedSub.id}`)
    console.log(`   Status: ${selectedSub.status}`)
    console.log(`   Price ID: ${selectedSub.items.data[0].price.id}`)
    console.log(`   Period Start: ${selectedSub.current_period_start}`)
    console.log(`   Period End: ${selectedSub.current_period_end}`)

    // Find the plan in database
    const priceId = selectedSub.items.data[0].price.id
    const planRows = unwrap('subscriptionPlan.findFirst',
      await supabase.from('subscription_plans').select('*').eq('stripe_price_id', priceId).limit(1))
    const plan = planRows?.[0]

    if (!plan) {
      console.error(`❌ No plan found in database for Price ID: ${priceId}`)
      return
    }

    console.log(`✅ Found plan: ${plan.name}`)

    // Delete existing subscription if any
    const existingSub = unwrap('subscription.findUnique',
      await supabase.from('subscriptions').select('id').eq('userId', user.id).maybeSingle())

    if (existingSub) {
      unwrap('subscription.delete',
        await supabase.from('subscriptions').delete().eq('userId', user.id))
      console.log(`🗑️  Deleted existing subscription`)
    }

    // Create subscription in database
    const currentPeriodStart = selectedSub.current_period_start
      ? new Date(selectedSub.current_period_start * 1000)
      : new Date()

    const currentPeriodEnd = selectedSub.current_period_end
      ? new Date(selectedSub.current_period_end * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now

    unwrap('subscription.create',
      await supabase.from('subscriptions').insert({
        userId: user.id,
        plan_id: plan.id,
        stripe_customer_id: customer.id,
        stripe_subscription_id: selectedSub.id,
        stripe_price_id: priceId,
        status: 'ACTIVE',
        current_period_start: iso(currentPeriodStart),
        current_period_end: iso(currentPeriodEnd),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))

    console.log(`✅ Created subscription in database`)

    // Update crew profile tier
    const tier = plan.name === 'Pro Profile' ? 'PRO' : 'BASIC'
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

    console.log(`✅ Updated tier to: ${tier}`)

    console.log(`\n✨ Import complete!`)
    console.log(`\n📋 Next steps:`)
    console.log('1. Refresh your dashboard (Ctrl+F5)')
    console.log(`2. You should now see "${tier}" status`)
    console.log('3. Cancel duplicate subscriptions in Stripe Dashboard if needed')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
  }
}

main()
