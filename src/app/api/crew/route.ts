import { NextResponse } from 'next/server'
import { getPublicCrew } from '@/lib/cache/public'
import { toIsoString } from '@/lib/utils'

interface CrewProfile {
  id: string
  photo: string | null
  city: string | null
  primaryRoles: string[]
  yearsExperience: string | null
  location: string | null
  availableToTravel: boolean
  availability: boolean
  availabilityStart: string | null
  availabilityEnd: string | null
  projectTypes: string[]
  dailyBudgetMin: number | null
  dailyBudgetMax: number | null
  languages: string[]
  imdbLink: string | null
  portfolioLinks: string[]
  pastProjects: Array<{
    title?: string
    year?: number
    role?: string
    link?: string | null
    notes?: string | null
  }>
  contactWhatsApp: string | null
  subscriptionTier: string
  createdAt: string
  user: {
    name: string
    email: string
    phone: string
    phoneVerified: boolean
  }
}

export async function GET() {
  try {
    // Fetch all crew profiles with their associated user data, filtering by CREW role
    const crewProfiles = await getPublicCrew()

    // Format the data to match the expected structure in the BrowseCrew component
    type RawProfile = {
      id: string
      user?: { name?: string | null; email?: string | null; phone?: string | null; phoneVerified?: boolean | null }
      photo?: string | null
      city?: string | null
      primaryRoles?: unknown
      yearsExperience?: string | null
      location?: string | null
      availableToTravel?: boolean | null
      availability?: boolean | null
      availabilityStart?: Date | string | null
      availabilityEnd?: Date | string | null
      projectTypes?: unknown
      dailyBudgetMin?: number | null
      dailyBudgetMax?: number | null
      languages?: unknown
      imdbLink?: string | null
      portfolioLinks?: unknown
      pastProjects?: unknown
      contactWhatsApp?: string | null
      subscriptionTier?: string | null
      createdAt?: Date | string | null
    }

    const formattedCrew = crewProfiles.map((profile: RawProfile) => {
      // Handle array fields that might be stored as strings or objects
      const primaryRoles = Array.isArray(profile.primaryRoles)
        ? profile.primaryRoles
        : (typeof profile.primaryRoles === 'string'
          ? JSON.parse(profile.primaryRoles)
          : [])

      const projectTypes = Array.isArray(profile.projectTypes)
        ? profile.projectTypes
        : (typeof profile.projectTypes === 'string'
          ? JSON.parse(profile.projectTypes)
          : [])

      const languages = Array.isArray(profile.languages)
        ? profile.languages
        : (typeof profile.languages === 'string'
          ? JSON.parse(profile.languages)
          : [])

      // Handle portfolioLinks which might be a string, object, or array
      let portfolioLinks: string[] = []
      if (Array.isArray(profile.portfolioLinks)) {
        portfolioLinks = profile.portfolioLinks
      } else if (typeof profile.portfolioLinks === 'string') {
        try {
          portfolioLinks = JSON.parse(profile.portfolioLinks)
        } catch (e) {
          // If it's a single string URL, make it an array with one element
          portfolioLinks = [profile.portfolioLinks]
        }
      }

      // Handle pastProjects which might be a string, object, or array
      let pastProjects: Array<{
        title?: string
        year?: number
        role?: string
        link?: string | null
        notes?: string | null
      }> = []
      if (Array.isArray(profile.pastProjects)) {
        pastProjects = (profile.pastProjects as unknown[]).filter((p: unknown) => p !== null) as Array<{ title?: string; year?: number; role?: string; link?: string | null; notes?: string | null }>
      } else if (typeof profile.pastProjects === 'string') {
        try {
          const parsed = JSON.parse(profile.pastProjects)
          pastProjects = Array.isArray(parsed) ? parsed : [parsed]
        } catch (e) {
          pastProjects = []
        }
      }

      return {
        id: profile.id,
        user: {
          name: profile.user?.name || '',
          email: '',
          phone: '',
          phoneVerified: profile.user?.phoneVerified || false
        },
        photo: profile.photo || null,
        city: profile.city || '',
        primaryRoles: primaryRoles || [],
        yearsExperience: profile.yearsExperience || '',
        location: profile.location || '',
        availableToTravel: profile.availableToTravel || false,
        availability: profile.availability || false,
        availabilityStart: toIsoString(profile.availabilityStart),
        availabilityEnd: toIsoString(profile.availabilityEnd),
        projectTypes: projectTypes || [],
        dailyBudgetMin: profile.dailyBudgetMin || null,
        dailyBudgetMax: profile.dailyBudgetMax || null,
        languages: languages || [],
        imdbLink: profile.imdbLink || '',
        portfolioLinks: portfolioLinks || [],
        pastProjects: pastProjects || [],
        contactWhatsApp: '',
        subscriptionTier: profile.subscriptionTier || '',
        createdAt: toIsoString(profile.createdAt) ?? new Date().toISOString()
      }
    })

    return NextResponse.json({ crew: formattedCrew }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } })
  } catch (error) {
    console.error('Error fetching crew members:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
