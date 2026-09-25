/**
 * Fix Stripe Customer Metadata
 * Adds userId to existing Stripe customers that are missing it
 */

require('dotenv').config()
const Stripe = require('stripe')
const { getSupabaseServiceClient, unwrap } = require('./lib/supabase')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
})
const supabase = getSupabaseServiceClient()

async function main() {
  const email = process.argv[2]

  if (!email) {
    console.log('Usage: node scripts/fix-stripe-customer-metadata.js <email>')
    process.exit(1)
  }

  console.log(`🔧 Fixing Stripe customer metadata for: ${email}\n`)

  try {
    // Get user from database
    const user = unwrap('user.findUnique',
      await supabase.from('users').select('*').eq('email', email).maybeSingle())

    if (!user) {
      console.error('❌ User not found in database')
      process.exit(1)
    }

    console.log(`✅ User found: ${user.name || user.email}`)
    console.log(`   User ID: ${user.id}`)

    // Find Stripe customer
    const customers = await stripe.customers.list({
      email: email,
      limit: 1
    })

    if (customers.data.length === 0) {
      console.error('❌ No Stripe customer found')
      process.exit(1)
    }

    const customer = customers.data[0]
    console.log(`\n✅ Stripe customer found: ${customer.id}`)
    console.log(`   Current metadata:`, customer.metadata)

    // Update metadata
    if (customer.metadata?.userId === user.id) {
      console.log('\n✨ Metadata already correct - no update needed!')
    } else {
      await stripe.customers.update(customer.id, {
        metadata: {
          userId: user.id
        }
      })
      console.log(`\n✅ Updated customer metadata with userId: ${user.id}`)
      console.log('\n✨ Done! Now your webhook will work for future subscriptions.')
      console.log('\n📋 Next steps:')
      console.log('1. Deploy the updated code to Vercel')
      console.log('2. Make sure STRIPE_WEBHOOK_SECRET is in Vercel env vars')
      console.log('3. Try a new subscription - it should auto-sync!')
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message)
  }
}

main()
