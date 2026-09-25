/**
 * Check Subscription Plans in Database
 */

require('dotenv').config()
const { getSupabaseServiceClient, unwrap } = require('./lib/supabase')

const supabase = getSupabaseServiceClient()

async function main() {
  console.log('📋 Subscription Plans in Database:\n')

  try {
    const plans = unwrap('subscription_plans.findMany',
      await supabase.from('subscription_plans').select('*'))

    plans.forEach(plan => {
      console.log(`Plan: ${plan.name}`)
      console.log(`  ID: ${plan.id}`)
      console.log(`  Price: ₹${plan.price}`)
      console.log(`  Stripe Price ID: ${plan.stripe_price_id || 'NOT SET'}`)
      console.log('')
    })

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

main()
