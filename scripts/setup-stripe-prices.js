/**
 * Stripe Setup Helper Script
 *
 * This script helps you set up Stripe products and prices for your subscription plans.
 * Run this after you've created products in Stripe Dashboard.
 *
 * Usage:
 * 1. Create products in Stripe Dashboard (Test mode)
 * 2. Copy the Price IDs
 * 3. Update the PRICE_IDS below
 * 4. Run: node scripts/setup-stripe-prices.js
 */

require('dotenv').config()
const { getSupabaseServiceClient, unwrap } = require('./lib/supabase')

const supabase = getSupabaseServiceClient()

// ⚠️ UPDATE THESE WITH YOUR STRIPE PRICE IDs (from Stripe Dashboard)
// IMPORTANT: Use Price IDs (price_...), NOT Product IDs (prod_...)
const STRIPE_PRICE_IDS = {
  BASIC: 'price_1SlQZPEHAhv8OPlEnJG02dpd',  // ₹199/month
  PRO: 'price_1SlQZQEHAhv8OPlE6jIR6Frj',    // ₹399/month
}

async function main() {
  console.log('🔧 Setting up Stripe Price IDs...\n')

  try {
    // Update Basic Plan
    const basicRows = unwrap('subscriptionPlan.findFirst',
      await supabase.from('subscription_plans').select('id').eq('name', 'Basic Profile').limit(1))
    const basicPlan = basicRows?.[0]

    if (basicPlan) {
      unwrap('subscriptionPlan.update',
        await supabase
          .from('subscription_plans')
          .update({
            stripe_price_id: STRIPE_PRICE_IDS.BASIC,
            updated_at: new Date().toISOString(),
          })
          .eq('id', basicPlan.id))
      console.log('✅ Updated Basic Profile with Price ID:', STRIPE_PRICE_IDS.BASIC)
    } else {
      console.log('⚠️  Basic Profile plan not found in database')
    }

    // Update Pro Plan
    const proRows = unwrap('subscriptionPlan.findFirst',
      await supabase.from('subscription_plans').select('id').eq('name', 'Pro Profile').limit(1))
    const proPlan = proRows?.[0]

    if (proPlan) {
      unwrap('subscriptionPlan.update',
        await supabase
          .from('subscription_plans')
          .update({
            stripe_price_id: STRIPE_PRICE_IDS.PRO,
            updated_at: new Date().toISOString(),
          })
          .eq('id', proPlan.id))
      console.log('✅ Updated Pro Profile with Price ID:', STRIPE_PRICE_IDS.PRO)
    } else {
      console.log('⚠️  Pro Profile plan not found in database')
    }

    console.log('\n✨ Stripe setup complete!')
    console.log('\n📋 Next steps:')
    console.log('1. Verify Price IDs in Stripe Dashboard')
    console.log('2. Set up webhook endpoint in Stripe')
    console.log('3. Add STRIPE_WEBHOOK_SECRET to .env')
    console.log('4. Test subscription flow')

  } catch (error) {
    console.error('❌ Error setting up Stripe:', error)
  }
}

main()

/*
STRIPE TEST MODE SETUP CHECKLIST:

□ 1. Sign up for Stripe account (stripe.com)
□ 2. Switch to Test mode in Stripe Dashboard
□ 3. Create Products:
   - Product 1: "Basic Profile" - ₹199/month (or $2.99/month)
   - Product 2: "Pro Profile" - ₹399/month (or $4.99/month)
□ 4. Copy Price IDs (price_...) from each product
□ 5. Update STRIPE_PRICE_IDS in this file
□ 6. Add Stripe keys to .env:
   - STRIPE_SECRET_KEY=sk_test_...
   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   - STRIPE_WEBHOOK_SECRET=whsec_...
□ 7. Run this script: node scripts/setup-stripe-prices.js
□ 8. Set up webhook endpoint:
   - URL: https://yourdomain.com/api/stripe/webhook
   - Events: checkout.session.completed, customer.subscription.*
□ 9. Test with card 4242 4242 4242 4242

TEST CARDS:
✅ Success: 4242 4242 4242 4242
❌ Decline: 4000 0000 0000 0002
🔐 3D Secure: 4000 0027 6000 3184
*/
