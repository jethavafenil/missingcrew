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
import { Check, ChevronLeft, ChevronRight, Save, Sparkles, AlertCircle } from 'lucide-react'
import { GAP_LABELS, coreGaps, fullGaps } from '@/lib/crew/readiness'
import { buildDraft } from '@/lib/crew/profileDraft'
import { isSafeReturnPath } from '@/lib/utils'

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
  gender?: string
  firstProjectDate?: string

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
    type?: string
  }> | null
  showreelUrl?: string
  customTags?: string[]

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
  // required fields that are still empty are marked once the member tries to continue
  const [showErrors, setShowErrors] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [saveError, setSaveError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [problems, setProblems] = useState<Record<string, string>>({})

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

  // What still blocks moving on from a step (the server checks the same rules again).
  const blockersFor = (step: number): string[] => {
    const out: string[] = []
    if (step === 1) {
      if (!(formData.name || '').trim()) out.push('Add your full name')
      for (const g of coreGaps({ photo: formData.photo, phone: formData.phone, city: formData.city })) out.push(GAP_LABELS[g])
    }
    if (step === 2) {
      if (!formData.primaryRoles || formData.primaryRoles.length === 0) out.push(GAP_LABELS.roles)
    }
    return out
  }
  const blockers = blockersFor(currentStep)

  // Sends the profile. Half-typed optional values (a 6-digit phone, a link still being pasted)
  // are left out so they can never stop the rest from saving.
  const postProfile = useCallback(async (extra: Record<string, unknown>) => {
    const { data, problems: draftProblems } = buildDraft(formData as Record<string, unknown>)
    setProblems(draftProblems as Record<string, string>)
    const body = {
      ...data,
      // If availability dates are set, ensure availableToTravel is true so the Dashboard toggle reflects it
      ...(formData.availabilityStart || formData.availabilityEnd ? { availableToTravel: true } : {}),
      userId: session?.user?.id,
      portfolioLinks: (data.portfolioLinks as unknown[]) || [],
      projectTypes: formData.projectTypes || [],
      primaryRoles: formData.primaryRoles || [],
      languages: formData.languages || [],
      pastProjects: formData.pastProjects || null,
      dailyBudgetMin: formData.dailyBudgetMin ?? null,
      dailyBudgetMax: formData.dailyBudgetMax ?? null,
      budgetRangeMin: formData.budgetRangeMin ?? null,
      budgetRangeMax: formData.budgetRangeMax ?? null,
      ...extra,
    }
    const response = await fetch('/api/crew/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      let message = 'Could not save your profile'
      try {
        const parsed = await response.json()
        if (parsed && typeof parsed.error === 'string') message = parsed.error
      } catch {
        // keep the generic message
      }
      throw new Error(message)
    }
    return draftProblems
  }, [formData, session?.user?.id])

  const saveProgress = useCallback(async () => {
    if (!session?.user?.id || Object.keys(formData).length === 0) return
    setSaveState('saving')
    try {
      await postProfile({ step: currentStep })
      setSaveError('')
      setSaveState('saved')
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save your profile')
      setSaveState('error')
    }
  }, [formData, currentStep, session?.user?.id, postProfile])

  // Auto-save: shortly after the last change
  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer)
      }

      const timer = setTimeout(async () => {
        await saveProgress()
      }, 1000)

      setAutoSaveTimer(timer)
    }
  }, [formData, saveProgress])

  const updateFormData = (newData: CrewProfileFormData) => {
    setFormData((prev: CrewProfileFormData) => ({ ...prev, ...newData }))
  }

  const nextStep = () => {
    // Required fields stop the step here (no jump to the next one) and are marked in red
    if (blockers.length > 0) {
      setShowErrors(true)
      return
    }
    setShowErrors(false)
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    setShowErrors(false)
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setSubmitError('')
    const gaps = fullGaps({ photo: formData.photo, phone: formData.phone, city: formData.city, primaryRoles: formData.primaryRoles, completed: true })
    if (!(formData.name || '').trim() || gaps.length > 0) {
      // go back to the step that has the missing item
      const core = gaps.some((g) => g === 'photo' || g === 'phone' || g === 'city') || !(formData.name || '').trim()
      setCurrentStep(core ? 1 : 2)
      setShowErrors(true)
      return
    }
    setIsLoading(true)
    try {
      await postProfile({ completed: true })

      // Check if referral was applied
      if (formData.referredBy && formData.referredBy.trim() !== '') {
        setReferralApplied(true)
      }

      // Back to where they came from (a job they wanted to apply to), else the dashboard
      const back = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('returnUrl') : null
      router.push(isSafeReturnPath(back) ? (back as string) : '/dashboard?profile=completed')
    } catch (error) {
      console.error('Error submitting profile:', error)
      setSubmitError(error instanceof Error ? error.message : 'Could not save your profile')
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
              showErrors={showErrors}
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
                pastProjects: formData.pastProjects || [],
                showreelUrl: formData.showreelUrl,
                customTags: formData.customTags || []
              }}
              saveState={saveState}
              onChange={updateFormData}
            />
          )}
          {currentStep === 5 && (
            <ContactStep
              data={{...formData, phone: formData.phone}}
              onChange={updateFormData}
            />
          )}

          {/* What is still missing (shown after the member tries to continue) */}
          {showErrors && blockers.length > 0 && (
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="alert">
              <p className="flex items-center gap-2 font-semibold">
                <AlertCircle className="h-4 w-4" aria-hidden="true" /> Complete these to continue
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6">
                {blockers.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          )}
          {submitError && <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{submitError}</p>}

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

        {/* Auto-save status */}
        <div className="text-center mt-6" aria-live="polite">
          <div className="inline-flex max-w-full items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md border border-gray-200">
            {saveState === 'error' ? (
              <>
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span className="text-sm font-medium text-red-700">Not saved: {saveError}</span>
              </>
            ) : saveState === 'saving' ? (
              <>
                <Save className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-medium text-gray-700">Saving…</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">{saveState === 'saved' ? 'All changes saved' : 'Auto-save is on'}</span>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
