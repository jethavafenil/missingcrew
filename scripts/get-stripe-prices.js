/**
 * Get Price IDs from Product IDs
 * This script retrieves all prices for given products
 */

require('dotenv').config()
const Stripe = require('stripe')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
})

const PRODUCT_IDS = {
  BASIC: 'prod_TisKVxDkItvATy',
  PRO: 'prod_TisKz6l8K5JzEJ'
}

async function main() {
  console.log('🔍 Fetching Price IDs from Stripe...\n')

  try {
    for (const [planName, productId] of Object.entries(PRODUCT_IDS)) {
      console.log(`${planName} Plan:`)
      console.log(`  Product ID: ${productId}`)

      // Get prices for this product
      const prices = await stripe.prices.list({
        product: productId,
        active: true,
        limit: 10
      })

      if (prices.data.length === 0) {
        console.log(`  ❌ No prices found for this product`)
        console.log(`  → You need to add a price in Stripe Dashboard`)
      } else {
        console.log(`  ✅ Found ${prices.data.length} price(s):`)
        prices.data.forEach((price, index) => {
          console.log(`\n  Price ${index + 1}:`)
          console.log(`    Price ID: ${price.id}`)
          console.log(`    Amount: ₹${price.unit_amount / 100}`)
          console.log(`    Interval: ${price.recurring?.interval || 'one-time'}`)
          console.log(`    Active: ${price.active}`)
        })
      }
      console.log('')
    }

    console.log('\n📋 Update your database with these Price IDs:')
    console.log('Run: node scripts/setup-stripe-prices.js')
    console.log('And use the Price IDs shown above (price_...)')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    if (error.type === 'StripeAuthenticationError') {
      console.error('Make sure STRIPE_SECRET_KEY is set in .env')
    }
  }
}

main()
