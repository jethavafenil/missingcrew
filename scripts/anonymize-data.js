/**
 * Anonymize Data Script
 *
 * This script anonymizes sensitive user data in your local database
 * for development/testing purposes. Run this AFTER importing production data.
 *
 * ⚠️ WARNING: This will modify data in your database!
 * Only run on local development databases.
 *
 * Usage:
 *   node scripts/anonymize-data.js
 */

require('dotenv').config()
const { faker } = require('@faker-js/faker')
const { getSupabaseServiceClient, unwrap } = require('./lib/supabase')

const supabase = getSupabaseServiceClient()

// Admin emails to preserve (these won't be anonymized)
const PRESERVE_EMAILS = [
  'admin@missingcrew.com',
  // Add any other emails you want to preserve
]

async function anonymizeData() {
  console.log('🔒 Starting data anonymization...\n')
  console.log('⚠️  This will modify user data in your database!')
  console.log('⏳ Waiting 3 seconds... Press Ctrl+C to cancel.\n')

  // Give user time to cancel
  await new Promise(resolve => setTimeout(resolve, 3000))

  try {
    // Get all users
    const userRows = unwrap('user.findMany',
      await supabase
        .from('users')
        .select('*,crew_profiles(*),employer_profiles(*)'))

    console.log(`👥 Found ${userRows.length} users to anonymize...\n`)

    let anonymizedCount = 0
    let preservedCount = 0

    for (const user of userRows) {
      // Skip preserved emails
      if (PRESERVE_EMAILS.includes(user.email)) {
        console.log(`   ⏭️  Preserving: ${user.email} (admin account)`)
        preservedCount++
        continue
      }

      // Generate fake data
      const firstName = faker.person.firstName()
      const lastName = faker.person.lastName()
      const fakeName = `${firstName} ${lastName}`
      const fakeEmail = faker.internet.email({ firstName, lastName }).toLowerCase()
      const fakePhone = faker.phone.number('+91##########')

      // Update user
      unwrap('user.update',
        await supabase
          .from('users')
          .update({
            name: fakeName,
            email: fakeEmail,
            phone: fakePhone,
            image: faker.image.avatar(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
          .select('id')
          .single())

      // Update crew profile if exists
      if (user.crew_profiles) {
        unwrap('crewProfile.update',
          await supabase
            .from('crew_profiles')
            .update({
              contact_whatsapp: fakePhone,
              city: faker.location.city(),
              location: faker.location.city() + ', ' + faker.location.state(),
              imdb_link: faker.datatype.boolean() ? `https://www.imdb.com/name/nm${faker.number.int({ min: 1000000, max: 9999999 })}` : null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.crew_profiles.id)
            .select('id')
            .single())
      }

      // Update employer profile if exists
      if (user.employer_profiles) {
        unwrap('employerProfile.update',
          await supabase
            .from('employer_profiles')
            .update({
              company_name: faker.company.name(),
              company_website: faker.datatype.boolean() ? faker.internet.url() : null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.employer_profiles.id)
            .select('id')
            .single())
      }

      anonymizedCount++

      if (anonymizedCount % 10 === 0) {
        console.log(`   ✅ Anonymized ${anonymizedCount} users...`)
      }
    }

    console.log(`\n✅ Anonymization complete!`)
    console.log(`   - Anonymized: ${anonymizedCount} users`)
    console.log(`   - Preserved: ${preservedCount} admin accounts`)
    console.log(`   - Total: ${userRows.length} users\n`)

    console.log('🔐 Sample anonymized data:')
    let sampleQuery = supabase
      .from('users')
      .select('name,email,phone,role')
      .limit(3)
    if (PRESERVE_EMAILS.length > 0) {
      sampleQuery = sampleQuery.not('email', 'in', `(${PRESERVE_EMAILS.map((e) => `"${e}"`).join(',')})`)
    }
    const sampleUsers = unwrap('user.findMany.sample', await sampleQuery)
    console.table(sampleUsers)

  } catch (error) {
    console.error('\n❌ Error anonymizing data:', error)
    process.exit(1)
  }
}

// Run the anonymization
anonymizeData()
