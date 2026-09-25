/**
 * Check Subscription Status
 * Checks both database and Stripe for subscription data
 */

require('dotenv').config()
const Stripe = require('stripe')
const { getSupabaseServiceClient, unwrap } = require('./lib/supabase')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
})
const supabase = getSupabaseServiceClient()

async function main() {
  const userEmail = process.argv[2] || 'hussain31320@gmail.com'

  console.log(`🔍 Checking subscription for: ${userEmail}\n`)

  try {
    // Check database
    const raw = unwrap('user.findUnique',
      await supabase
        .from('users')
        .select('*,crew_profiles(*),subscriptions(*,plan:subscription_plans(*))')
        .eq('email', userEmail)
        .maybeSingle())

    if (!raw) {
      console.error('❌ User not found in database')
      return
    }

    const user = {
      name: raw.name,
      email: raw.email,
      id: raw.id,
      crewProfile: raw.crew_profiles,
      subscriptions: raw.subscriptions?.[0] || null,
    }

    console.log(`✅ User: ${user.name}`)
    console.log(`📧 Email: ${user.email}`)
    console.log(`🆔 User ID: ${user.id}`)

    if (user.crewProfile) {
      console.log(`\n📊 Current Tier: ${user.crewProfile.subscription_tier}`)
    }

    console.log(`\n💾 Database Subscription:`)
    if (user.subscriptions) {
      console.log(`   ✅ Found: ${user.subscriptions.plan?.name}`)
      console.log(`   Status: ${user.subscriptions.status}`)
      console.log(`   Stripe Customer ID: ${user.subscriptions.stripe_customer_id || 'N/A'}`)
      console.log(`   Stripe Subscription ID: ${user.subscriptions.stripe_subscription_id || 'N/A'}`)
    } else {
      console.log(`   ⚠️  No subscription in database`)
    }

    // Check Stripe
    console.log(`\n☁️  Stripe Status:`)
    try {
      // Search for customer by email
      const customers = await stripe.customers.list({
        email: userEmail,
        limit: 1
      })

      if (customers.data.length > 0) {
        const customer = customers.data[0]
        console.log(`   ✅ Customer found: ${customer.id}`)

        // Get subscriptions for this customer
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          limit: 10
        })

        if (subscriptions.data.length > 0) {
          console.log(`   ✅ Found ${subscriptions.data.length} subscription(s):`)
          subscriptions.data.forEach((sub, index) => {
            console.log(`\n   Subscription ${index + 1}:`)
            console.log(`   - ID: ${sub.id}`)
            console.log(`   - Status: ${sub.status}`)
            console.log(`   - Price ID: ${sub.items.data[0].price.id}`)
            console.log(`   - Amount: ₹${sub.items.data[0].price.unit_amount / 100}`)
          })

          // If there's an active subscription in Stripe but not in DB
          const activeStripeSub = subscriptions.data.find(s => s.status === 'active')
          if (activeStripeSub && !user.subscriptions) {
            console.log(`\n\n⚠️  MISMATCH DETECTED!`)
            console.log(`   Stripe has active subscription but database doesn't`)
            console.log(`   Run this to sync:`)
            console.log(`   node scripts/import-stripe-subscription.js ${userEmail}`)
          }
        } else {
          console.log(`   ⚠️  No subscriptions found in Stripe`)
        }
      } else {
        console.log(`   ⚠️  No customer found in Stripe`)
      }
    } catch (stripeError) {
      console.log(`   ❌ Error checking Stripe:`, stripeError.message)
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message)
  }
}

main()
