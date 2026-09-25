// Basic Info Step Types
export interface CrewProfileBasicInfo {
  name: string
  email: string
  firstName?: string
  lastName?: string
  displayName?: string
  photo?: string
  city?: string
}

// Professional Details Step Types
export interface CrewProfileProfessionalDetails {
  primaryRole?: string
  skills?: string[]
  experience?: string
  yearsExperience?: number
  specializations?: string[]
}

// Availability Step Types
export interface CrewProfileAvailability {
  availability?: string[]
  hourlyRate?: string
  dailyRate?: string
  projectMinBudget?: string
  travelWillingness?: boolean
  remoteWork?: boolean
}

// Portfolio Step Types
export interface CrewProfilePortfolio {
  portfolioLinks?: string[]
  websiteUrl?: string
  imdbUrl?: string
  demoReelUrl?: string
  bio?: string
}

// Contact Step Types
export interface CrewProfileContact {
  phone?: string
  city?: string
  state?: string
  country?: string
  preferredContact?: string
  referralCode?: string
  notes?: string
}

// Complete Crew Profile (combination of all steps)
export interface CrewProfileFormData 
  extends CrewProfileBasicInfo,
    CrewProfileProfessionalDetails,
    CrewProfileAvailability,
    CrewProfilePortfolio,
    CrewProfileContact {
  userId?: string
  step?: number
  completed?: boolean
}

// Props for step components
export interface BasicInfoStepProps {
  data: CrewProfileBasicInfo
  onChange: (data: Partial<CrewProfileBasicInfo>) => void
}

export interface ProfessionalDetailsStepProps {
  data: CrewProfileProfessionalDetails
  onChange: (data: Partial<CrewProfileProfessionalDetails>) => void
}

export interface AvailabilityStepProps {
  data: CrewProfileAvailability
  onChange: (data: Partial<CrewProfileAvailability>) => void
}

export interface PortfolioStepProps {
  data: CrewProfilePortfolio
  onChange: (data: Partial<CrewProfilePortfolio>) => void
}

export interface ContactStepProps {
  data: CrewProfileContact
  onChange: (data: Partial<CrewProfileContact>) => void
}