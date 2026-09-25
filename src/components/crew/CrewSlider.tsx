'use client'

import { CrewCard } from './CrewCard'

interface CrewMember {
  id: string
  user: {
    name: string
    email: string
    phone: string
    phoneVerified: boolean
  }
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
}

interface CrewSliderProps {
  crew: CrewMember[]
}

export function CrewSlider({ crew }: CrewSliderProps) {
  // Display up to 6 crew members in a 2x3 grid
  const displayedCrew = crew.slice(0, 6)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {displayedCrew.map((crewMember) => (
        <div key={crewMember.id} className="h-full">
          <CrewCard crew={crewMember} />
        </div>
      ))}
    </div>
  )
}
