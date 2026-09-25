import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import {
  userRepo,
  crewProfileRepo,
  employerProfileRepo,
  projectRepo,
  assertAdmin,
  requesterFromSession,
} from '@/lib/repo'
import bcrypt from 'bcryptjs'

interface ImportData {
  crewProfiles: Array<{
    name: string
    email: string
    phone: string
    phoneVerified?: boolean
    city: string
    budgetRangeMin: number
    budgetRangeMax: number
    budgetFlexible?: boolean
    primaryRoles: string[]
    yearsExperience: string
    location: string
    availableToTravel?: boolean
    availability?: boolean
    availabilityStart?: string
    availabilityEnd?: string
    projectTypes: string[]
    dailyBudgetMin: number
    dailyBudgetMax: number
    languages: string[]
    imdbLink?: string
    portfolioLinks: Array<{
      platform: string
      url: string
    }>
    pastProjects: Array<{
      title: string
      role: string
      year: string
      description: string
      type: string
    }>
    referredBy?: string
    contactWhatsApp: string
    subscriptionTier?: string
    trialEnds?: string
    completed?: boolean
  }>
  employerProfiles: Array<{
    name: string
    email: string
    phone: string
    phoneVerified?: boolean
    companyName: string
    companyWebsite: string
    completed?: boolean
  }>
  projects: Array<{
    projectName: string
    projectType: string
    rolesNeeded: Array<{
      role: string
      count: number
    }>
    shootStartDate: string
    shootEndDate: string
    location: string
    budgetPerRole: Record<string, {
      min: number
      max: number
    }>
    description: string
    questions: Array<{
      question: string
    }>
    contactPreference: string
    status?: string
  }>
}

export async function POST(request: Request) {
  const session = await getSession()

  // If not logged in, return unauthorized
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // If not admin, return forbidden
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Forbidden - Admin access required' },
      { status: 403 }
    )
  }

  try {
    // Parse the JSON data from the request
    const data = await request.json()

    // Validate the data structure
    if (!data || !data.crewProfiles || !data.employerProfiles || !data.projects) {
      return NextResponse.json(
        { error: 'Invalid data structure. Expected crewProfiles, employerProfiles, and projects arrays.' },
        { status: 400 }
      )
    }

    // Create users and profiles
    const results = {
      usersCreated: 0,
      crewProfilesCreated: 0,
      employerProfilesCreated: 0,
      projectsCreated: 0,
      errors: [] as string[]
    }

    const requester = assertAdmin(requesterFromSession(session))

    // Create crew users and profiles
    for (const profile of data.crewProfiles) {
      try {
        // Check if user already exists
        const existingUser = await userRepo.findByEmail(profile.email, requester)

        if (!existingUser) {
          // Create user
          const hashedPassword = await bcrypt.hash('password123', 10)
          const user = await userRepo.createUser(
            {
              name: profile.name,
              email: profile.email,
              phone: profile.phone,
              phoneVerified: profile.phoneVerified || false,
              role: 'CREW',
              password: hashedPassword
            },
            requester
          )
          results.usersCreated++

          // Create crew profile
          await crewProfileRepo.create(
            {
              userId: user.id,
              city: profile.city,
              budgetRangeMin: profile.budgetRangeMin,
              budgetRangeMax: profile.budgetRangeMax,
              budgetFlexible: profile.budgetFlexible || false,
              primaryRoles: profile.primaryRoles,
              yearsExperience: profile.yearsExperience,
              location: profile.location,
              availableToTravel: profile.availableToTravel || false,
              availability: profile.availability || false,
              availabilityStart: profile.availabilityStart ? new Date(profile.availabilityStart) : null,
              availabilityEnd: profile.availabilityEnd ? new Date(profile.availabilityEnd) : null,
              projectTypes: profile.projectTypes,
              dailyBudgetMin: profile.dailyBudgetMin,
              dailyBudgetMax: profile.dailyBudgetMax,
              languages: profile.languages,
              imdbLink: profile.imdbLink || null,
              portfolioLinks: profile.portfolioLinks,
              pastProjects: profile.pastProjects,
              referredBy: profile.referredBy || null,
              contactWhatsApp: profile.contactWhatsApp,
              subscriptionTier: profile.subscriptionTier || 'FREE_TRIAL',
              trialEnds: profile.trialEnds ? new Date(profile.trialEnds) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
              completed: profile.completed || true
            },
            requester
          )
          results.crewProfilesCreated++
        } else {
          results.errors.push(`User with email ${profile.email} already exists`)
        }
      } catch (error) {
        results.errors.push(`Error creating crew profile for ${profile.email}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    // Create employer users and profiles
    for (const profile of data.employerProfiles) {
      try {
        // Check if user already exists
        const existingUser = await userRepo.findByEmail(profile.email, requester)

        if (!existingUser) {
          // Create user
          const hashedPassword = await bcrypt.hash('password123', 10)
          const user = await userRepo.createUser(
            {
              name: profile.name,
              email: profile.email,
              phone: profile.phone,
              phoneVerified: profile.phoneVerified || false,
              role: 'EMPLOYER',
              password: hashedPassword
            },
            requester
          )
          results.usersCreated++

          // Create employer profile
          await employerProfileRepo.create(
            {
              userId: user.id,
              companyName: profile.companyName,
              companyWebsite: profile.companyWebsite,
              completed: profile.completed || true
            },
            requester
          )
          results.employerProfilesCreated++
        } else {
          results.errors.push(`User with email ${profile.email} already exists`)
        }
      } catch (error) {
        results.errors.push(`Error creating employer profile for ${profile.email}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    // Create projects
    for (const project of data.projects) {
      try {
        // Find a random employer to assign the project to
        const employers = await employerProfileRepo.findMany(requester)

        if (employers.length === 0) {
          results.errors.push('No employers found to assign projects to')
          continue
        }

        // Select a random employer
        const randomEmployer = employers[Math.floor(Math.random() * employers.length)]

        // Create project
        await projectRepo.create(
          {
            employerId: randomEmployer.id,
            projectName: project.projectName,
            projectType: project.projectType,
            rolesNeeded: project.rolesNeeded,
            shootStartDate: new Date(project.shootStartDate),
            shootEndDate: new Date(project.shootEndDate),
            location: project.location,
            budgetPerRole: project.budgetPerRole,
            description: project.description,
            questions: project.questions,
            contactPreference: project.contactPreference,
            status: project.status || 'OPEN'
          },
          requester
        )
        results.projectsCreated++
      } catch (error) {
        results.errors.push(`Error creating project ${project.projectName}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Data imported successfully',
      results
    })

  } catch (error) {
    console.error('Error importing data:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
