'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from '@/lib/auth/session-context'
import { useRouter } from 'next/navigation'
import { ProgressBar } from '@/components/ui/progress-bar'
import { BasicInfoStep } from '@/components/crew-profile/BasicInfoStep'
import { ProfessionalDetailsStep } from '@/components/crew-profile/ProfessionalDetailsStep'
import { AvailabilityStep } from '@/components/crew-profile/AvailabilityStep'
import { PortfolioStep } from '@/components/crew-profile/PortfolioStep'
import { ContactStep } from '@/components/crew-profile/ContactStep'
import { Button } from '@/components/ui/button'
import { Check, ChevronLeft, ChevronRight, Save, Sparkles } from 'lucide-react'

// Define the complete form data type
interface CrewProfileFormData {
  // Basic Info
  photo?: string
  name?: string
  phone?: string
  city?: string
  termsAgreed?: boolean

  // Professional Details
  primaryRoles?: string[]
  yearsExperience?: string
  location?: string
  availableToTravel?: boolean

  // Availability & Budget
  availability?: boolean
  availabilityStart?: string
  availabilityEnd?: string
  projectTypes?: string[]
  dailyBudgetMin?: number | null
  dailyBudgetMax?: number | null
  budgetFlexible?: boolean
  budgetRangeMin?: number | null
  budgetRangeMax?: number | null

  // Portfolio & Links
  portfolioLinks?: Array<{url: string, title?: string} | string>
  imdbLink?: string
  languages?: string[]
  pastProjects?: Array<{
    title: string
    year: string
    role: string
    link?: string
  }> | null

  // Contact & Referral
  contactWhatsApp?: string
  referredBy?: string
  phoneVerified?: boolean
}

const STEPS = [
  'Basic Info',
  'Professional Details',
  'Availability & Budget',
  'Portfolio & Links',
  'Contact & Referral'
]

export default function CrewProfileSetup() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<CrewProfileFormData>({})
  const [isLoading, setIsLoading] = useState(false)
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout>()
  const [referralApplied, setReferralApplied] = useState(false)

  // Fetch user profile data on mount
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!session?.user?.id) return

      try {
        const response = await fetch('/api/crew/profile')
        if (!response.ok) throw new Error('Failed to fetch profile data')

        const result = await response.json()
        // Ensure the data is properly formatted
        const data = result.data || {}

        // Convert numeric fields to numbers if they're strings
        if (data.dailyBudgetMin && typeof data.dailyBudgetMin === 'string') {
          data.dailyBudgetMin = parseInt(data.dailyBudgetMin) || null
        }
        if (data.dailyBudgetMax && typeof data.dailyBudgetMax === 'string') {
          data.dailyBudgetMax = parseInt(data.dailyBudgetMax) || null
        }
        if (data.budgetRangeMin && typeof data.budgetRangeMin === 'string') {
          data.budgetRangeMin = parseInt(data.budgetRangeMin) || null
        }
        if (data.budgetRangeMax && typeof data.budgetRangeMax === 'string') {
          data.budgetRangeMax = parseInt(data.budgetRangeMax) || null
        }

        // Ensure arrays are properly initialized
        if (!data.portfolioLinks) data.portfolioLinks = []
        if (!data.projectTypes) data.projectTypes = []
        if (!data.primaryRoles) data.primaryRoles = []
        if (!data.languages) data.languages = []
        if (!data.pastProjects) data.pastProjects = []

        setFormData(data)
      } catch (error) {
        console.error('Error fetching profile data:', error)
      }
    }

    fetchProfileData()
  }, [session])

  // Redirect if not authenticated or not crew
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/accounts?tab=signin&role=crew')
    }
    if (session?.user?.role !== 'CREW') {
      router.push('/dashboard')
    }
  }, [session, status, router])

  const saveProgress = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      // Only save if we have meaningful data to save
      if (Object.keys(formData).length === 0) return

      // Prepare data for saving
      const dataToSave = {
        ...formData,
        // If availability dates are set, ensure availableToTravel is true so the Dashboard toggle reflects it
        ...(formData.availabilityStart || formData.availabilityEnd ? { availableToTravel: true } : {}),
        userId: session.user.id,
        step: currentStep,
        // Ensure arrays are properly formatted
        portfolioLinks: formData.portfolioLinks || [],
        projectTypes: formData.projectTypes || [],
        primaryRoles: formData.primaryRoles || [],
        languages: formData.languages || [],
        // Handle past projects
        pastProjects: formData.pastProjects || null,
        // Convert empty strings to null for numeric fields
        dailyBudgetMin: formData.dailyBudgetMin !== undefined && formData.dailyBudgetMin !== null ?
          formData.dailyBudgetMin : null,
        dailyBudgetMax: formData.dailyBudgetMax !== undefined && formData.dailyBudgetMax !== null ?
          formData.dailyBudgetMax : null,
        budgetRangeMin: formData.budgetRangeMin !== undefined && formData.budgetRangeMin !== null ?
          formData.budgetRangeMin : null,
        budgetRangeMax: formData.budgetRangeMax !== undefined && formData.budgetRangeMax !== null ?
          formData.budgetRangeMax : null
      }

      console.log('Saving progress with data:', dataToSave)

      const response = await fetch('/api/crew/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave),
      })

    if (!response.ok) {
      // Try to parse error data, but handle the case where response might be empty
      const errorData: { error: string } = { error: 'Failed to save progress' }
      let responseText = ''

      try {
        responseText = await response.text()
        if (responseText) {
          try {
            const parsedData = JSON.parse(responseText)
            // If the parsed data is an object with an error property, use it
            if (parsedData && typeof parsedData === 'object' && 'error' in parsedData) {
              errorData.error = parsedData.error
            } else if (typeof parsedData === 'string') {
              // If it's a string, use it as the error message
              errorData.error = parsedData
            }
          } catch (e) {
            // If JSON parsing fails, use the raw text as the error message
            errorData.error = responseText || 'Unknown server error'
          }
        } else {
          // If response is empty, provide a more descriptive error
          errorData.error = 'Empty response from server'
        }
      } catch (e) {
        // If reading response fails, use a default error message
        console.error('Failed to read error response:', e)
        errorData.error = 'Failed to read server response'
      }

      console.error('Failed to save progress. Server response:', errorData)
      throw new Error(errorData.error)
    }

    // Parse the successful response to ensure it's valid
    const responseData = await response.json()
    console.log('Progress saved successfully:', responseData)
  } catch (error) {
    console.error('Error saving progress:', error)
  }
}, [formData, currentStep, session?.user?.id])

  // Auto-save functionality
  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer)
      }

      const timer = setTimeout(async () => {
        await saveProgress()
      }, 2000)

      setAutoSaveTimer(timer)
    }
  }, [formData, saveProgress])

  const updateFormData = (newData: CrewProfileFormData) => {
    setFormData((prev: CrewProfileFormData) => ({ ...prev, ...newData }))
  }

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      // Create a copy of formData and add the completed flag
      const dataToSubmit = {
        ...formData,
        // If availability dates are set, ensure availableToTravel is true so the Dashboard toggle reflects it
        ...(formData.availabilityStart || formData.availabilityEnd ? { availableToTravel: true } : {}),
        userId: session?.user?.id,
        completed: true,
        // Ensure arrays are properly formatted
        portfolioLinks: formData.portfolioLinks || [],
        projectTypes: formData.projectTypes || [],
        primaryRoles: formData.primaryRoles || [],
        languages: formData.languages || [],
        // Handle past projects
        pastProjects: formData.pastProjects || null,
        // Convert empty strings to null for numeric fields
        dailyBudgetMin: formData.dailyBudgetMin !== undefined && formData.dailyBudgetMin !== null ?
          formData.dailyBudgetMin : null,
        dailyBudgetMax: formData.dailyBudgetMax !== undefined && formData.dailyBudgetMax !== null ?
          formData.dailyBudgetMax : null,
        budgetRangeMin: formData.budgetRangeMin !== undefined && formData.budgetRangeMin !== null ?
          formData.budgetRangeMin : null,
        budgetRangeMax: formData.budgetRangeMax !== undefined && formData.budgetRangeMax !== null ?
          formData.budgetRangeMax : null
      }

      console.log('Submitting profile data:', dataToSubmit)

      const response = await fetch('/api/crew/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit),
      })

      if (!response.ok) {
        // Try to parse error data, but handle the case where response might be empty
        const errorData: { error: string } = { error: 'Failed to submit profile' }
        let responseText = ''

        try {
          responseText = await response.text()
          if (responseText) {
            try {
              const parsedData = JSON.parse(responseText)
              // If the parsed data is an object with an error property, use it
              if (parsedData && typeof parsedData === 'object' && 'error' in parsedData) {
                errorData.error = parsedData.error
              } else if (typeof parsedData === 'string') {
                // If it's a string, use it as the error message
                errorData.error = parsedData
              }
            } catch (e) {
              // If JSON parsing fails, use the raw text as the error message
              errorData.error = responseText || 'Unknown server error'
            }
          } else {
            // If response is empty, provide a more descriptive error
            errorData.error = 'Empty response from server'
          }
        } catch (e) {
          // If reading response fails, use a default error message
          console.error('Failed to read error response:', e)
          errorData.error = 'Failed to read server response'
        }

        console.error('Failed to submit profile. Server response:', errorData)
        throw new Error(errorData.error)
      }

      // Check if referral was applied
      if (formData.referredBy && formData.referredBy.trim() !== '') {
        setReferralApplied(true)
      }

      // Redirect to dashboard with a success message
      router.push('/dashboard?profile=completed')
    } catch (error) {
      console.error('Error submitting profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent mb-3">
            Complete Your Profile
          </h1>
          <p className="text-gray-600 text-lg">
            Step {currentStep} of {STEPS.length}: <span className="font-semibold text-indigo-600">{STEPS[currentStep - 1]}</span>
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <ProgressBar steps={STEPS.length} currentStep={currentStep} />
          <div className="grid grid-cols-5 gap-2 mt-4">
            {STEPS.map((step, index) => (
              <div
                key={step}
                className={`text-center transition-all duration-200 ${
                  currentStep > index + 1
                    ? 'opacity-100'
                    : currentStep === index + 1
                    ? 'opacity-100'
                    : 'opacity-50'
                }`}
              >
                <div className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                  currentStep > index + 1
                    ? 'bg-green-100 text-green-600'
                    : currentStep === index + 1
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {currentStep > index + 1 ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-bold">{index + 1}</span>
                  )}
                </div>
                <span className={`text-xs font-medium block ${
                  currentStep > index + 1
                    ? 'text-green-600'
                    : currentStep === index + 1
                    ? 'text-indigo-600'
                    : 'text-gray-500'
                }`}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Steps */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                {currentStep}
              </span>
              {STEPS[currentStep - 1]}
            </h2>
          </div>
          <div className="p-8">
          {currentStep === 1 && (
            <BasicInfoStep
              data={formData}
              onChange={updateFormData}
            />
          )}
          {currentStep === 2 && (
            <ProfessionalDetailsStep
              data={formData}
              onChange={updateFormData}
            />
          )}
          {currentStep === 3 && (
            <AvailabilityStep
              data={{
                availability: formData.availability,
                availabilityStart: formData.availabilityStart,
                availabilityEnd: formData.availabilityEnd,
                projectTypes: formData.projectTypes,
                dailyBudgetMin: formData.dailyBudgetMin || undefined,
                dailyBudgetMax: formData.dailyBudgetMax || undefined,
                budgetFlexible: formData.budgetFlexible,
                availableToTravel: formData.availableToTravel
              }}
              onChange={updateFormData}
            />
          )}
          {currentStep === 4 && (
            <PortfolioStep
              data={{
                portfolioLinks: formData.portfolioLinks || [],
                imdbLink: formData.imdbLink,
                languages: formData.languages || [],
                pastProjects: formData.pastProjects || []
              }}
              onChange={updateFormData}
            />
          )}
          {currentStep === 5 && (
            <ContactStep
              data={{...formData, phone: formData.phone}}
              onChange={updateFormData}
            />
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            {currentStep < STEPS.length ? (
              <Button 
                onClick={nextStep}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg flex items-center gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={isLoading || !formData.termsAgreed}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Complete Profile
                  </>
                )}
              </Button>
            )}
          </div>
          </div>
        </div>

        {/* Auto-save Indicator */}
        <div className="text-center mt-6">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md border border-gray-200">
            <Save className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Auto-save enabled</span>
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          </div>
        </div>
      </div>
    </div>
  )
}
