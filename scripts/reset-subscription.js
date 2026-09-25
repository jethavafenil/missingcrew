/**
 * Reset User Subscription to Free Trial
 * This script resets a user's subscription tier back to FREE_TRIAL
 *
 * Usage: node scripts/reset-subscription.js YOUR_EMAIL
 */

require('dotenv').config()
const { getSupabaseServiceClient, unwrap, iso } = require('./lib/supabase')

const supabase = getSupabaseServiceClient()

async function main() {
  const userEmail = process.argv[2] || 'hussain31320@gmail.com'

  console.log(`🔄 Resetting subscription for: ${userEmail}\n`)

  try {
    // Find user
    const raw = unwrap('user.findUnique',
      await supabase
        .from('users')
        .select('*,crew_profiles(*),subscriptions(*)')
        .eq('email', userEmail)
        .maybeSingle())

    if (!raw) {
      console.error('❌ User not found with email:', userEmail)
      return
    }

    console.log(`✅ Found user: ${raw.name} (${raw.email})`)

    // Update crew profile to FREE_TRIAL
    if (raw.crew_profiles) {
      unwrap('crewProfile.update',
        await supabase
          .from('crew_profiles')
          .update({
            subscription_tier: 'FREE_TRIAL',
            trial_ends: iso(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days from now
            updated_at: new Date().toISOString(),
          })
          .eq('userId', raw.id)
          .select('id')
          .single())
      console.log('✅ Updated crew profile to FREE_TRIAL')
      console.log('   Trial ends:', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString())
    }

    // Cancel active subscription if exists
    if (raw.subscriptions?.length) {
      unwrap('subscription.update',
        await supabase
          .from('subscriptions')
          .update({ status: 'CANCELED', updated_at: new Date().toISOString() })
          .eq('userId', raw.id)
          .select('id')
          .single())
      console.log('✅ Canceled active subscription')
    }

    console.log('\n✨ Subscription reset complete!')
    console.log('\n📋 Next steps:')
    console.log('1. Refresh your dashboard (Ctrl+F5)')
    console.log('2. You should now see "Free Trial" status')
    console.log('3. You can upgrade to a new plan from /subscription-plans')

  } catch (error) {
    console.error('\n❌ Error:', error)
  }
}

main()
