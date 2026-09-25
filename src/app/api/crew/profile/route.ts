import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { userRepo, crewProfileRepo, requesterFromSession } from '@/lib/repo'
import { revalidateTag } from 'next/cache'


export async function POST(request: NextRequest) {
  try {
    // Log the request body for debugging
    const requestBody = await request.json()

    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }


    // Extract the actual profile data from the nested data object if it exists
    const rawProfileData = requestBody.data || requestBody
    const { userId, name, phone, phoneVerified, step, completed, ...profileData } = rawProfileData
    // Keep track of which fields the client actually sent, to avoid overwriting existing data
    const providedKeys = new Set(Object.keys(profileData))

    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requester = requesterFromSession(session)

    // Ensure portfolioLinks, projectTypes, and primaryRoles are always included
    // Convert portfolioLinks to array if it's a string or not an array
    let portfolioLinks = profileData.portfolioLinks || []
    if (typeof portfolioLinks === 'string') {
      try {
        portfolioLinks = JSON.parse(portfolioLinks)
      } catch (e) {
        portfolioLinks = [portfolioLinks] // If it's a single string, make it an array with one element
      }
    }
    if (!Array.isArray(portfolioLinks)) {
      portfolioLinks = []
    }

    // Validate and normalize IMDb profile link if provided
    const imdbRaw = typeof profileData.imdbLink === 'string' ? profileData.imdbLink.trim() : ''
    let imdbLink: string | null = null
    if (imdbRaw) {
      // Normalize common variants (http, no-www or m.imdb.com host, missing
      // trailing slash) so users aren't rejected for cosmetic differences.
      const normalized = imdbRaw
        .replace(/^http:\/\//i, 'https://')
        .replace(/\/+$/, '')
        .replace(/^https:\/\/(?:www\.|m\.)?imdb\.com\//i, 'https://www.imdb.com/')
      const imdbRegex = /^https:\/\/www\.imdb\.com\/name\/nm\d{7,8}$/
      if (!imdbRegex.test(normalized)) {
        return NextResponse.json({
          error: 'Invalid IMDb Profile Link. Expected format: https://www.imdb.com/name/nm0000129/'
        }, { status: 400 })
      }
      imdbLink = `${normalized}/`
    }

    const completeProfileData = {
      ...profileData,
      portfolioLinks: portfolioLinks,
      projectTypes: profileData.projectTypes || [],
      primaryRoles: profileData.primaryRoles || [],
      languages: profileData.languages || [], // Add languages field with default empty array
      // Format date fields
      availabilityStart: profileData.availabilityStart ? new Date(profileData.availabilityStart) : null,
      availabilityEnd: profileData.availabilityEnd ? new Date(profileData.availabilityEnd) : null,
      // Ensure numeric fields are properly handled
      dailyBudgetMin: profileData.dailyBudgetMin !== undefined && profileData.dailyBudgetMin !== null ?
        Number(profileData.dailyBudgetMin) : null,
      dailyBudgetMax: profileData.dailyBudgetMax !== undefined && profileData.dailyBudgetMax !== null ?
        Number(profileData.dailyBudgetMax) : null,
      budgetRangeMin: profileData.budgetRangeMin !== undefined && profileData.budgetRangeMin !== null ?
        Number(profileData.budgetRangeMin) : null,
      budgetRangeMax: profileData.budgetRangeMax !== undefined && profileData.budgetRangeMax !== null ?
        Number(profileData.budgetRangeMax) : null,
      imdbLink: imdbLink
    }

    // Update User and CrewProfile separately to avoid transaction timeout
    let crewProfile;

    // Update User model with name, phone, and phoneVerified
    const userUpdateData: {
      name?: string;
      phone?: string;
      phoneVerified?: boolean;
    } = {}
    if (name !== undefined) userUpdateData.name = name
    if (phone !== undefined) userUpdateData.phone = phone
    if (phoneVerified !== undefined) userUpdateData.phoneVerified = phoneVerified

    if (Object.keys(userUpdateData).length > 0) {
      await userRepo.updateUser(session.user.id, userUpdateData, requester)
    }

    // Upsert the CrewProfile
    // Remove id from create data if it exists to avoid conflicts
    const { id: _, ...createData } = completeProfileData

    // First check if a profile already exists
    const existingProfile = await crewProfileRepo.findByUserId(session.user.id, requester)

    // Log the profile data for debugging

    // Check if this is a new profile completion with referral
    const isCompletingWithReferral = completed && 
      !existingProfile?.completed && 
      completeProfileData.referredBy && 
      completeProfileData.referredBy.trim() !== ''

    // If someone used a referral code, grant the REFERRER 2 months free
    if (isCompletingWithReferral) {
      const referralEmail = completeProfileData.referredBy.trim()

      // Find the referrer by email only
      const referrer = await userRepo.findByEmailIgnoreCaseWithCrew(referralEmail, requester)

      // Grant referrer 2 months free subscription
      if (referrer?.crewProfile) {
        const twoMonthsFromNow = new Date()
        twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2)

        await crewProfileRepo.updateById(
          (referrer.crewProfile as { id: string }).id,
          {
            trialEnds: twoMonthsFromNow,
            subscriptionTier: 'FREE_TRIAL'
          },
          requester
        )

      } else {
      }
    }

    if (existingProfile) {
      // Update existing profile - remove user data from update
      const { user, completed, ...profileDataWithoutUser } = completeProfileData

      // Convert arrays to JSON format for Prisma
      // Build updateData from only provided keys to avoid resetting fields inadvertently
      const updateData: Record<string, any> = {
        updatedAt: new Date(),
      }

      // Copy over only fields that were explicitly provided in the request
      for (const key of Array.from(providedKeys)) {
        // Map defaults for known array/object fields only if the key is provided
        if (key === 'primaryRoles') updateData.primaryRoles = profileDataWithoutUser.primaryRoles || []
        else if (key === 'projectTypes') updateData.projectTypes = profileDataWithoutUser.projectTypes || []
        else if (key === 'portfolioLinks') updateData.portfolioLinks = profileDataWithoutUser.portfolioLinks || []
        else if (key === 'languages') updateData.languages = profileDataWithoutUser.languages || []
        else if (key === 'pastProjects') updateData.pastProjects = profileDataWithoutUser.pastProjects || null
        else updateData[key] = (profileDataWithoutUser as any)[key]
      }


      // New user gets standard 30-day trial (referrer gets the bonus)
      if (!existingProfile.trialEnds) {
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
        updateData.trialEnds = thirtyDaysFromNow
      }

      crewProfile = await crewProfileRepo.updateById(
        existingProfile.id,
        updateData as Parameters<typeof crewProfileRepo.updateById>[1],
        requester
      )

    } else {
      // Create new profile
      const createDataWithArrays = {
        ...createData,
        primaryRoles: createData.primaryRoles || [],
        projectTypes: createData.projectTypes || [],
        portfolioLinks: createData.portfolioLinks || [],
        languages: createData.languages || [],
        pastProjects: createData.pastProjects || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }


      // All new users get standard 30-day trial (referrer gets the bonus)
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      createDataWithArrays.trialEnds = thirtyDaysFromNow

      crewProfile = await crewProfileRepo.create(
        {
          userId: session.user.id,
          ...createDataWithArrays,
        } as Parameters<typeof crewProfileRepo.create>[0],
        requester
      )

    }

    // Return the response in the format expected by the client
    revalidateTag('crew-profiles', 'max')
    return NextResponse.json({ data: crewProfile || {} })
  } catch (error) {
    console.error('Error saving crew profile:', error)
    let errorMessage = 'Internal server error'

    if (error instanceof Error) {
      errorMessage = error.message
    }

    // Return error in the format expected by the client
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const crewProfile = await crewProfileRepo.findByUserIdWithUser(session.user.id)

      // Merge user data with crew profile for the form
      if (crewProfile) {
        // Convert JSON fields to arrays if they exist
        const primaryRoles = Array.isArray(crewProfile.primaryRoles) ?
          crewProfile.primaryRoles : (crewProfile.primaryRoles as { value?: string[] })?.value || []
        const projectTypes = Array.isArray(crewProfile.projectTypes) ?
          crewProfile.projectTypes : (crewProfile.projectTypes as { value?: string[] })?.value || []
        const languages = Array.isArray(crewProfile.languages) ?
          crewProfile.languages : (crewProfile.languages as { value?: string[] })?.value || []

        // Handle portfolioLinks specially to ensure it's always an array
        let portfolioLinks = []
        if (crewProfile.portfolioLinks) {
          if (Array.isArray(crewProfile.portfolioLinks)) {
            portfolioLinks = crewProfile.portfolioLinks
          } else if (typeof crewProfile.portfolioLinks === 'string') {
            try {
              portfolioLinks = JSON.parse(crewProfile.portfolioLinks)
            } catch (e) {
              // If it's a single string URL, make it an array with one element
              portfolioLinks = [crewProfile.portfolioLinks]
            }
          } else if (typeof crewProfile.portfolioLinks === 'object') {
            // Handle JSON object format
            portfolioLinks = (crewProfile.portfolioLinks as { value?: string[] })?.value || []
          }
        }

        // Convert past projects if it exists
        let pastProjects: Array<{title: string, year: string, role: string}> = []
        if (crewProfile.pastProjects) {
          if (Array.isArray(crewProfile.pastProjects)) {
            // Filter out any null values that might be in the array
            pastProjects = crewProfile.pastProjects.filter((p: any) => p !== null) as Array<{title: string, year: string, role: string}>
          } else if (typeof crewProfile.pastProjects === 'object') {
            // Handle JSON object format
            const projectsObj = crewProfile.pastProjects as Record<string, {title: string, year: string, role: string}>
            pastProjects = Object.values(projectsObj).filter(p => p !== null)
          }
        }

        return NextResponse.json({
          data: {
            ...crewProfile,
            name: crewProfile.user?.name,
            phone: crewProfile.user?.phone,
            phoneVerified: crewProfile.user?.phoneVerified ?? false,
            primaryRoles: primaryRoles,
            projectTypes: projectTypes,
            portfolioLinks: portfolioLinks,
            languages: languages,
            // Ensure all required fields have default values
            city: crewProfile.city || '',
            yearsExperience: crewProfile.yearsExperience || '',
            location: crewProfile.location || '',
            availableToTravel: crewProfile.availableToTravel || false,
            availability: (crewProfile.availability ?? false),
            availabilityStart: crewProfile.availabilityStart ? crewProfile.availabilityStart.toISOString() : null,
            availabilityEnd: crewProfile.availabilityEnd ? crewProfile.availabilityEnd.toISOString() : null,
            dailyBudgetMin: crewProfile.dailyBudgetMin || null,
            dailyBudgetMax: crewProfile.dailyBudgetMax || null,
            budgetFlexible: crewProfile.budgetFlexible || false,
            budgetRangeMin: crewProfile.budgetRangeMin || null,
            budgetRangeMax: crewProfile.budgetRangeMax || null,
            imdbLink: crewProfile.imdbLink || '',
            contactWhatsApp: crewProfile.contactWhatsApp || '',
            referredBy: crewProfile.referredBy || '',
            pastProjects: pastProjects
          }
        })
      }

    return NextResponse.json({ data: {} })
  } catch (error) {
    console.error('Error fetching crew profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
