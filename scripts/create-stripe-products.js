/**
 * Create Stripe Products and Prices
 * This script creates products in Stripe and updates your database with the Price IDs
 *
 * Usage: node scripts/create-stripe-products.js
 */

require('dotenv').config()
const Stripe = require('stripe')
const { getSupabaseServiceClient, unwrap } = require('./lib/supabase')

const supabase = getSupabaseServiceClient()

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
})

async function main() {
  console.log('🚀 Creating Stripe Products and Prices...\n')

  try {
    // Get existing plans from database
    const plans = unwrap('subscriptionPlan.findMany',
      await supabase.from('subscription_plans').select('*'))

    for (const plan of plans) {
      console.log(`\n📦 Processing: ${plan.name}`)

      // Create product in Stripe
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: {
          planId: plan.id
        }
      })

      console.log(`✅ Created product: ${product.id}`)

      // Create price in Stripe
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.price * 100, // Convert to cents/paise
        currency: 'inr', // Change to 'usd' if needed
        recurring: {
          interval: 'month'
        },
        metadata: {
          planId: plan.id
        }
      })

      console.log(`✅ Created price: ${price.id}`)

      // Update database with Price ID
      unwrap('subscriptionPlan.update',
        await supabase
          .from('subscription_plans')
          .update({
            stripe_price_id: price.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', plan.id))

      console.log(`✅ Updated database with Price ID: ${price.id}`)
    }

    console.log('\n\n✨ All products and prices created successfully!')
    console.log('\n📋 Next steps:')
    console.log('1. Test subscription flow at /subscription-plans')
    console.log('2. Use test card: 4242 4242 4242 4242')
    console.log('3. Set up webhooks in Stripe Dashboard')

  } catch (error) {
    console.error('\n❌ Error:', error)
    if (error.type === 'StripeAuthenticationError') {
      console.error('\n⚠️  Make sure STRIPE_SECRET_KEY is set in your .env file')
      console.error('   Get it from: https://dashboard.stripe.com/test/apikeys')
    }
  }
}

main()
