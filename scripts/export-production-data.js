/**
 * Export Production Data Script
 *
 * This script exports all data from your production Supabase database
 * to a JSON file for migration to local environment.
 *
 * Usage:
 *   Set PROD_SUPABASE_URL and PROD_SUPABASE_SERVICE_ROLE_KEY environment
 *   variables (falls back to SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY), then run:
 *   node scripts/export-production-data.js
 */

require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { getSupabaseServiceClient, unwrap, camelizeRow, mapAccountRow } = require('./lib/supabase')

const supabase = getSupabaseServiceClient({
  url: process.env.PROD_SUPABASE_URL,
  key: process.env.PROD_SUPABASE_SERVICE_ROLE_KEY,
})

async function exportData() {
  console.log('🚀 Starting production data export...\n')

  try {
    // Export Subscription Plans
    console.log('📦 Exporting subscription plans...')
    const subscriptionPlans = unwrap('subscriptionPlan.findMany',
      await supabase.from('subscription_plans').select('*')).map(camelizeRow)
    console.log(`   ✅ Found ${subscriptionPlans.length} subscription plans`)

    // Export Users with profiles
    console.log('👥 Exporting users...')
    const userRows = unwrap('user.findMany',
      await supabase
        .from('users')
        .select('*,accounts(*),sessions(*),crew_profiles(*),employer_profiles(*),verification_tokens(*)'))
    const users = userRows.map((u) => {
      const { accounts, sessions, crew_profiles, employer_profiles, verification_tokens, ...rest } = u
      return {
        ...camelizeRow(rest),
        accounts: (accounts ?? []).map(mapAccountRow),
        sessions: (sessions ?? []).map(camelizeRow),
        crewProfile: crew_profiles ? camelizeRow(crew_profiles) : null,
        employerProfile: employer_profiles ? camelizeRow(employer_profiles) : null,
        verificationTokens: (verification_tokens ?? []).map(camelizeRow),
      }
    })
    console.log(`   ✅ Found ${users.length} users`)

    // Export Projects
    console.log('📋 Exporting projects...')
    const projects = unwrap('project.findMany',
      await supabase.from('projects').select('*')).map(camelizeRow)
    console.log(`   ✅ Found ${projects.length} projects`)

    // Export Applications
    console.log('📝 Exporting applications...')
    const applications = unwrap('application.findMany',
      await supabase.from('applications').select('*')).map(camelizeRow)
    console.log(`   ✅ Found ${applications.length} applications`)

    // Export Connections
    console.log('🔗 Exporting connections...')
    const connections = unwrap('connection.findMany',
      await supabase.from('connections').select('*')).map(camelizeRow)
    console.log(`   ✅ Found ${connections.length} connections`)

    // Export Notifications
    console.log('🔔 Exporting notifications...')
    const notifications = unwrap('notification.findMany',
      await supabase.from('notifications').select('*')).map(camelizeRow)
    console.log(`   ✅ Found ${notifications.length} notifications`)

    // Export Wishlists
    console.log('⭐ Exporting wishlists...')
    const wishlists = unwrap('wishlist.findMany',
      await supabase.from('wishlists').select('*')).map(camelizeRow)
    console.log(`   ✅ Found ${wishlists.length} wishlist items`)

    // Export Subscriptions
    console.log('💳 Exporting subscriptions...')
    const subscriptions = unwrap('subscription.findMany',
      await supabase.from('subscriptions').select('*')).map(camelizeRow)
    console.log(`   ✅ Found ${subscriptions.length} subscriptions`)

    // Prepare export data
    const exportData = {
      exportDate: new Date().toISOString(),
      counts: {
        subscriptionPlans: subscriptionPlans.length,
        users: users.length,
        projects: projects.length,
        applications: applications.length,
        connections: connections.length,
        notifications: notifications.length,
        wishlists: wishlists.length,
        subscriptions: subscriptions.length,
      },
      data: {
        subscriptionPlans,
        users,
        projects,
        applications,
        connections,
        notifications,
        wishlists,
        subscriptions,
      }
    }

    // Create exports directory if it doesn't exist
    const exportsDir = path.join(process.cwd(), 'exports')
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir)
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
    const filename = `production_data_${timestamp}.json`
    const filepath = path.join(exportsDir, filename)

    // Write to file
    fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2))

    console.log('\n✅ Export completed successfully!')
    console.log(`📁 File saved to: ${filepath}`)
    console.log(`📊 Total records: ${Object.values(exportData.counts).reduce((a, b) => a + b, 0)}`)
    console.log('\n📋 Summary:')
    Object.entries(exportData.counts).forEach(([key, count]) => {
      console.log(`   - ${key}: ${count}`)
    })

  } catch (error) {
    console.error('\n❌ Error exporting data:', error)
    process.exit(1)
  }
}

// Run the export
exportData()
