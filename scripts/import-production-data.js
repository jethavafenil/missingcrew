/**
 * Import Production Data Script
 *
 * This script imports data from an exported JSON file
 * to your local Supabase database.
 *
 * Usage:
 *   node scripts/import-production-data.js [filename]
 *
 * If no filename is provided, it will use the most recent export file.
 */

require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { getSupabaseServiceClient, unwrap, toDbRow } = require('./lib/supabase')

const supabase = getSupabaseServiceClient()

/**
 * Emulate Prisma's upsert: find by key, then update (only the given fields,
 * leaving create-only fields like created_at untouched) or insert.
 * Pass `updateCols: null` for a no-op update (Prisma `update: {}`).
 */
async function upsertRow(table, keyCol, keyValue, updateCols, createCols, label) {
  const existing = unwrap(`${label}.find`,
    await supabase.from(table).select('id').eq(keyCol, keyValue).maybeSingle())
  if (existing) {
    if (!updateCols) return
    unwrap(`${label}.update`,
      await supabase.from(table).update(updateCols).eq(keyCol, keyValue))
    return
  }
  unwrap(`${label}.create`,
    await supabase.from(table).insert(createCols))
}

async function importData(filename) {
  console.log('🚀 Starting data import to local database...\n')

  try {
    // Determine file to import
    let filepath
    if (filename) {
      filepath = path.join(process.cwd(), 'exports', filename)
    } else {
      // Find most recent export file
      const exportsDir = path.join(process.cwd(), 'exports')
      const files = fs.readdirSync(exportsDir)
        .filter(f => f.startsWith('production_data_') && f.endsWith('.json'))
        .sort()
        .reverse()

      if (files.length === 0) {
        throw new Error('No export files found in exports/ directory')
      }

      filepath = path.join(exportsDir, files[0])
      console.log(`📁 Using most recent export: ${files[0]}\n`)
    }

    // Read and parse data
    console.log(`📖 Reading data from: ${filepath}`)
    const rawData = fs.readFileSync(filepath, 'utf8')
    const exportData = JSON.parse(rawData)

    console.log(`📅 Export date: ${exportData.exportDate}`)
    console.log(`📊 Total records to import: ${Object.values(exportData.counts).reduce((a, b) => a + b, 0)}\n`)

    const data = exportData.data

    // Import in correct order (respecting foreign keys)

    // 1. Subscription Plans (no dependencies)
    console.log('💳 Importing subscription plans...')
    for (const plan of data.subscriptionPlans) {
      const cols = toDbRow({
        name: plan.name,
        price: plan.price,
        description: plan.description,
        features: plan.features,
        updatedAt: plan.updatedAt,
      }, 'subscription_plans')
      const create = toDbRow({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        description: plan.description,
        features: plan.features,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
      }, 'subscription_plans')
      await upsertRow('subscription_plans', 'id', plan.id, cols, create, 'subscriptionPlan')
    }
    console.log(`   ✅ Imported ${data.subscriptionPlans.length} subscription plans\n`)

    // 2. Users (no dependencies except self-referential)
    console.log('👥 Importing users...')
    for (const user of data.users) {
      const { accounts, sessions, crewProfile, employerProfile, verificationTokens, ...userData } = user

      await upsertRow('users', 'id', user.id,
        toDbRow({
          name: userData.name,
          email: userData.email,
          emailVerified: userData.emailVerified ?? null,
          image: userData.image,
          phone: userData.phone,
          phoneVerified: userData.phoneVerified,
          role: userData.role,
          password: userData.password,
          updatedAt: userData.updatedAt,
        }, 'users'),
        toDbRow({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          emailVerified: userData.emailVerified ?? null,
          image: userData.image,
          phone: userData.phone,
          phoneVerified: userData.phoneVerified,
          role: userData.role,
          password: userData.password,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
        }, 'users'),
        'user')

      // Import Accounts
      if (accounts && accounts.length > 0) {
        for (const account of accounts) {
          const updateCols = toDbRow({
            type: account.type,
            refresh_token: account.refresh_token,
            access_token: account.access_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
            session_state: account.session_state,
          }, 'accounts')
          const existing = unwrap('account.find',
            await supabase
              .from('accounts')
              .select('id')
              .eq('provider', account.provider)
              .eq('provider_account_id', account.providerAccountId)
              .maybeSingle())
          if (existing) {
            unwrap('account.update',
              await supabase.from('accounts').update(updateCols)
                .eq('provider', account.provider)
                .eq('provider_account_id', account.providerAccountId))
          } else {
            unwrap('account.create',
              await supabase.from('accounts').insert(toDbRow({
                id: account.id,
                userId: account.userId,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state,
              }, 'accounts')))
          }
        }
      }

      // Import Sessions
      if (sessions && sessions.length > 0) {
        for (const session of sessions) {
          await upsertRow('sessions', 'id', session.id,
            toDbRow({
              sessionToken: session.sessionToken,
              expires: session.expires,
            }, 'sessions'),
            toDbRow({
              id: session.id,
              sessionToken: session.sessionToken,
              userId: session.userId,
              expires: session.expires,
            }, 'sessions'),
            'session')
        }
      }

      // Import Verification Tokens
      if (verificationTokens && verificationTokens.length > 0) {
        for (const token of verificationTokens) {
          try {
            await upsertRow('verification_tokens', 'id', token.id,
              toDbRow({
                token: token.token,
                expires: token.expires,
              }, 'verification_tokens'),
              toDbRow({
                id: token.id,
                token: token.token,
                userId: token.userId,
                expires: token.expires,
                createdAt: token.createdAt,
              }, 'verification_tokens'),
              'verificationToken')
          } catch (error) {
            // Skip if expired token
            if (!error.message.includes('unique constraint')) {
              console.warn(`   ⚠️  Skipping expired verification token for user ${user.email}`)
            }
          }
        }
      }
    }
    console.log(`   ✅ Imported ${data.users.length} users\n`)

    // 3. Crew Profiles (depends on Users)
    console.log('🎬 Importing crew profiles...')
    let crewCount = 0
    for (const user of data.users) {
      if (user.crewProfile) {
        const profile = user.crewProfile
        const shared = {
          photo: profile.photo,
          city: profile.city,
          budgetRangeMin: profile.budgetRangeMin,
          budgetRangeMax: profile.budgetRangeMax,
          budgetFlexible: profile.budgetFlexible,
          primaryRoles: profile.primaryRoles,
          yearsExperience: profile.yearsExperience,
          location: profile.location,
          availableToTravel: profile.availableToTravel,
          availability: profile.availability,
          availabilityStart: profile.availabilityStart ?? null,
          availabilityEnd: profile.availabilityEnd ?? null,
          projectTypes: profile.projectTypes,
          dailyBudgetMin: profile.dailyBudgetMin,
          dailyBudgetMax: profile.dailyBudgetMax,
          languages: profile.languages,
          imdbLink: profile.imdbLink,
          portfolioLinks: profile.portfolioLinks,
          pastProjects: profile.pastProjects,
          referredBy: profile.referredBy,
          contactWhatsApp: profile.contactWhatsApp,
          termsAgreed: profile.termsAgreed,
          subscriptionTier: profile.subscriptionTier,
          trialEnds: profile.trialEnds ?? null,
          completed: profile.completed,
          updatedAt: profile.updatedAt,
        }
        await upsertRow('crew_profiles', 'id', profile.id,
          toDbRow(shared, 'crew_profiles'),
          toDbRow({ id: profile.id, userId: profile.userId, ...shared, createdAt: profile.createdAt }, 'crew_profiles'),
          'crewProfile')
        crewCount++
      }
    }
    console.log(`   ✅ Imported ${crewCount} crew profiles\n`)

    // 4. Employer Profiles (depends on Users)
    console.log('🏢 Importing employer profiles...')
    let employerCount = 0
    for (const user of data.users) {
      if (user.employerProfile) {
        const profile = user.employerProfile
        await upsertRow('employer_profiles', 'id', profile.id,
          toDbRow({
            companyName: profile.companyName,
            companyWebsite: profile.companyWebsite,
            completed: profile.completed,
            updatedAt: profile.updatedAt,
          }, 'employer_profiles'),
          toDbRow({
            id: profile.id,
            userId: profile.userId,
            companyName: profile.companyName,
            companyWebsite: profile.companyWebsite,
            completed: profile.completed,
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
          }, 'employer_profiles'),
          'employerProfile')
        employerCount++
      }
    }
    console.log(`   ✅ Imported ${employerCount} employer profiles\n`)

    // 5. Projects (depends on EmployerProfile)
    console.log('📋 Importing projects...')
    for (const project of data.projects) {
      const shared = {
        projectName: project.projectName,
        projectType: project.projectType,
        rolesNeeded: project.rolesNeeded,
        shootStartDate: project.shootStartDate,
        shootEndDate: project.shootEndDate,
        location: project.location,
        budgetPerRole: project.budgetPerRole,
        description: project.description,
        questions: project.questions,
        contactPreference: project.contactPreference,
        status: project.status,
        updatedAt: project.updatedAt,
      }
      await upsertRow('projects', 'id', project.id,
        toDbRow(shared, 'projects'),
        toDbRow({ id: project.id, employerId: project.employerId, ...shared, createdAt: project.createdAt }, 'projects'),
        'project')
    }
    console.log(`   ✅ Imported ${data.projects.length} projects\n`)

    // 6. Applications (depends on Projects and CrewProfiles)
    console.log('📝 Importing applications...')
    for (const app of data.applications) {
      const shared = {
        status: app.status,
        employerNotes: app.employerNotes,
        crewNotes: app.crewNotes,
        answers: app.answers,
      }
      await upsertRow('applications', 'id', app.id,
        toDbRow(shared, 'applications'),
        toDbRow({ id: app.id, projectId: app.projectId, crewId: app.crewId, appliedAt: app.appliedAt, ...shared }, 'applications'),
        'application')
    }
    console.log(`   ✅ Imported ${data.applications.length} applications\n`)

    // 7. Connections (depends on Users)
    console.log('🔗 Importing connections...')
    for (const conn of data.connections) {
      await upsertRow('connections', 'id', conn.id,
        toDbRow({ status: conn.status, updatedAt: conn.updatedAt }, 'connections'),
        toDbRow({
          id: conn.id,
          requesterId: conn.requesterId,
          receiverId: conn.receiverId,
          status: conn.status,
          createdAt: conn.createdAt,
          updatedAt: conn.updatedAt,
        }, 'connections'),
        'connection')
    }
    console.log(`   ✅ Imported ${data.connections.length} connections\n`)

    // 8. Notifications (depends on Users)
    console.log('🔔 Importing notifications...')
    for (const notif of data.notifications) {
      const shared = {
        type: notif.type,
        title: notif.title,
        message: notif.message,
        read: notif.read,
        data: notif.data,
      }
      await upsertRow('notifications', 'id', notif.id,
        toDbRow(shared, 'notifications'),
        toDbRow({ id: notif.id, userId: notif.userId, ...shared, createdAt: notif.createdAt }, 'notifications'),
        'notification')
    }
    console.log(`   ✅ Imported ${data.notifications.length} notifications\n`)

    // 9. Wishlists (depends on Users, Projects, CrewProfiles)
    console.log('⭐ Importing wishlists...')
    for (const wish of data.wishlists) {
      await upsertRow('wishlists', 'id', wish.id,
        null, // Prisma upsert had `update: {}` — no-op when the row exists
        toDbRow({
          id: wish.id,
          userId: wish.userId,
          crewId: wish.crewId,
          projectId: wish.projectId,
          createdAt: wish.createdAt,
        }, 'wishlists'),
        'wishlist')
    }
    console.log(`   ✅ Imported ${data.wishlists.length} wishlist items\n`)

    // 10. Subscriptions (depends on Users and SubscriptionPlans)
    console.log('💳 Importing subscriptions...')
    for (const sub of data.subscriptions) {
      const shared = {
        status: sub.status,
        razorpaySubscriptionId: sub.razorpaySubscriptionId,
        razorpayPaymentId: sub.razorpayPaymentId,
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
        updatedAt: sub.updatedAt,
      }
      await upsertRow('subscriptions', 'id', sub.id,
        toDbRow(shared, 'subscriptions'),
        toDbRow({
          id: sub.id,
          userId: sub.userId,
          planId: sub.planId,
          ...shared,
          createdAt: sub.createdAt,
        }, 'subscriptions'),
        'subscription')
    }
    console.log(`   ✅ Imported ${data.subscriptions.length} subscriptions\n`)

    console.log('✅ Import completed successfully!')
    console.log(`📊 Total records imported: ${Object.values(exportData.counts).reduce((a, b) => a + b, 0)}`)

  } catch (error) {
    console.error('\n❌ Error importing data:', error)
    process.exit(1)
  }
}

// Get filename from command line args
const filename = process.argv[2]

// Run the import
importData(filename)
