/**
 * Sync Subscription Tier from Subscription Table
 * This syncs the crew profile tier based on their active subscription
 *
 * Usage: node scripts/sync-subscription-tier.js YOUR_EMAIL
 */

require('dotenv').config()
const { getSupabaseServiceClient, unwrap } = require('./lib/supabase')

const supabase = getSupabaseServiceClient()

async function main() {
  const userEmail = process.argv[2] || 'hussain31320@gmail.com'

  console.log(`🔄 Syncing subscription tier for: ${userEmail}\n`)

  try {
    const raw = unwrap('user.findUnique',
      await supabase
        .from('users')
        .select('*,subscriptions(*,plan:subscription_plans(*))')
        .eq('email', userEmail)
        .maybeSingle())

    if (!raw) {
      console.error('❌ User not found')
      return
    }

    console.log(`✅ Found user: ${raw.name}`)

    const subscription = raw.subscriptions?.[0] || null
    if (!subscription) {
      console.log('⚠️  No subscription found - keeping current tier')
      return
    }

    console.log(`📋 Subscription: ${subscription.plan?.name}`)
    console.log(`   Status: ${subscription.status}`)

    if (subscription.status === 'ACTIVE') {
      const tier = subscription.plan?.name === 'Pro Profile' ? 'PRO' : 'BASIC'

      unwrap('crewProfile.update',
        await supabase
          .from('crew_profiles')
          .update({
            subscription_tier: tier,
            updated_at: new Date().toISOString(),
          })
          .eq('userId', raw.id)
          .select('id')
          .single())

      console.log(`\n✅ Updated subscription tier to: ${tier}`)
      console.log('\n📋 Next steps:')
      console.log('1. Refresh your dashboard (Ctrl+F5)')
      console.log(`2. You should now see "${tier}" status`)
    } else {
      console.log(`\n⚠️  Subscription is ${subscription.status} - not updating tier`)
    }

  } catch (error) {
    console.error('\n❌ Error:', error)
  }
}

main()
