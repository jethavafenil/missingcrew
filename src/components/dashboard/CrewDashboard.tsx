'use client'

import React, { useState, useEffect } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { ProjectCardWrapper } from '@/components/projects/ProjectCardWrapper'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, MapPin, Briefcase, DollarSign, Users, Clock, CheckCircle, AlertTriangle, FileText, Phone, Heart, RefreshCw, UserPlus } from 'lucide-react'
import { ConnectionRequestCard } from '@/components/network/ConnectionRequestCard'
import { NetworkList } from '@/components/network/NetworkList'
import { CrewSubscriptionCard } from '@/components/subscription/CrewSubscriptionCard'
import { slugifyName } from '@/lib/utils'
import { swrFetcher } from '@/lib/swr'

// Utility function to format date
function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'N/A'

  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return 'N/A'
  }
}

// Utility function to safely extract hostname from URL
function getHostnameFromUrl(url: string | null | undefined): string {
  try {
    // First check if it's a valid URL
    if (!url || typeof url !== 'string') return 'Invalid link'

    // Clean up the URL - remove any whitespace and quotes
    const cleanUrl = url.trim().replace(/^['"]|['"]$/g, '')

    // If it doesn't start with http:// or https://, try to add https://
    let urlToParse = cleanUrl
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      urlToParse = `https://${cleanUrl}`
    }

    // Try to create URL object
    const parsedUrl = new URL(urlToParse)
    return parsedUrl.hostname
  } catch (e) {
    // If URL parsing fails, try to extract domain manually
    if (typeof url === 'string') {
      // Remove any protocol or path
      let domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '')

      // Remove path and query parameters
      domain = domain.split('/')[0].split('?')[0]

      // If it looks like a domain (contains a dot), return it
      if (domain.includes('.')) {
        return domain
      }
    }

    // If all else fails, return the original string or a fallback
    return typeof url === 'string' && url.includes('.') ? url : 'Invalid link'
  }
}

interface CrewUserData {
  email: string
  name?: string
  role?: string
  crewProfile?: {
    // Basic info
    id?: string
    userId?: string
    photo?: string | null
    city?: string | null
    budgetRangeMin?: number | null
    budgetRangeMax?: number | null
    budgetFlexible?: boolean
    // Professional details
    primaryRoles?: string[]
    yearsExperience?: string | null
    location?: string | null
    // Availability
    availableToTravel?: boolean
    availability?: boolean
    availabilityStart?: string | null
    availabilityEnd?: string | null
    projectTypes?: string[]
    dailyBudgetMin?: number | null
    dailyBudgetMax?: number | null
    languages?: string[]
    // Portfolio
    imdbLink?: string | null
    portfolioLinks?: string[]
    pastProjects?: string | null
    referredBy?: string | null
    // Contact info
    contactWhatsApp?: string | null
    // Subscription
    subscriptionTier?: string
    trialEnds?: string | null
    // Dates
    createdAt?: string
    updatedAt?: string
    // Completion status
    completed?: boolean
    // Other fields
    [key: string]: unknown
  }
  // add other profile fields as needed
  [key: string]: unknown
}

interface Project {
  id: string
  projectName: string
  projectType: string
  rolesNeeded: string[]
  shootStartDate: string
  shootEndDate: string
  location: string
  description: string
  questions: string[]
  employer: {
    user: {
      name: string
    }
  }
  _count: {
    applications: number
  }
}

interface CrewDashboardProps {
  user: { name?: string } | null
  userData?: CrewUserData | null
}

// Fetcher function for SWR
const fetcher: (url: string) => Promise<any> = swrFetcher

export function CrewDashboard({ user, userData }: CrewDashboardProps) {
  // Check if user has completed their profile
  const hasProfile = userData?.crewProfile && Object.keys(userData.crewProfile).length > 0
  // Check if profile is complete by checking if required fields are filled
  const isProfileComplete = hasProfile && userData.crewProfile?.completed

  // Format availability status
  const formatAvailability = (availability: boolean | undefined) => {
    if (availability === undefined) return 'Not specified'
    return availability ? (
      <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-100">
        Available
      </Badge>
    ) : (
      <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">
        Not Available
      </Badge>
    )
  }

  // Travel preference toggle state
  const [travelAvailable, setTravelAvailable] = useState<boolean>(userData?.crewProfile?.availableToTravel ?? false)
  const [savingTravel, setSavingTravel] = useState<boolean>(false)
  const [travelError, setTravelError] = useState<string | null>(null)
  const [showAvailabilityPicker, setShowAvailabilityPicker] = useState<boolean>(false)
  const [availabilityStart, setAvailabilityStart] = useState<string | null>(userData?.crewProfile?.availabilityStart ?? null)
  const [availabilityEnd, setAvailabilityEnd] = useState<string | null>(userData?.crewProfile?.availabilityEnd ?? null)

  // Sync local state when userData arrives/changes
  useEffect(() => {
    if (userData?.crewProfile) {
      setTravelAvailable(!!userData.crewProfile.availableToTravel)
      setAvailabilityStart(userData.crewProfile.availabilityStart ?? null)
      setAvailabilityEnd(userData.crewProfile.availabilityEnd ?? null)
    }
  }, [userData])

  const saveProfile = async (payload: Record<string, unknown>) => {
    setSavingTravel(true)
    setTravelError(null)
    try {
      const body = {
        userId: (userData?.crewProfile as any)?.userId,
        ...payload,
      }
      const res = await fetch('/api/crew/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || 'Failed to update profile')
      }
    } catch (e) {
      setTravelError(e instanceof Error ? e.message : 'Failed to update')
      throw e
    } finally {
      setSavingTravel(false)
    }
  }

  const handleTravelToggle = async (checked: boolean) => {
    // Optimistic update
    setTravelAvailable(checked)
    setShowAvailabilityPicker(checked) // when turning on, show the picker

    // If turning off, save immediately and optionally clear dates
    if (!checked) {
      try {
        // Clear local dates immediately for UI consistency
        setAvailabilityStart(null)
        setAvailabilityEnd(null)
        await saveProfile({ availableToTravel: false, availabilityStart: null, availabilityEnd: null })
      } catch (e) {
        // Revert on error
        setTravelAvailable(true)
        // Restore picker and leave dates untouched if error
        setShowAvailabilityPicker(true)
      }
    }
  }

  const handleSaveAvailabilityDates = async () => {
    try {
      await saveProfile({
        availableToTravel: travelAvailable,
        availabilityStart: availabilityStart,
        availabilityEnd: availabilityEnd,
      })
      setShowAvailabilityPicker(false)
    } catch (e) {
      // Leave the picker open so the user can retry or cancel
    }
  }

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    if (!userData?.crewProfile) return 0

    const profile = userData.crewProfile
    const totalFields = 12 // Total number of fields we're checking
    let completedFields = 0

    // Check each field
    if (profile.photo) completedFields++
    if (profile.city) completedFields++
    if (profile.primaryRoles && profile.primaryRoles.length > 0) completedFields++
    if (profile.yearsExperience) completedFields++
    if (profile.availability !== undefined) completedFields++
    if (profile.availableToTravel !== undefined) completedFields++
    if (profile.availabilityStart) completedFields++
    if (profile.availabilityEnd) completedFields++
    if (profile.contactWhatsApp) completedFields++
    if (profile.imdbLink) completedFields++
    if (profile.portfolioLinks && profile.portfolioLinks.length > 0) completedFields++
    if (profile.projectTypes && profile.projectTypes.length > 0) completedFields++

    return Math.round((completedFields / totalFields) * 100)
  }

  // State for projects and applications
  const [activeTab, setActiveTab] = useState('dashboard')

  // Use SWR for fetching projects and applications with automatic caching and revalidation
  const { data: projectsData, error: projectsError, isLoading: isLoadingProjects, mutate: mutateProjects } = useSWR<{ projects: Project[] }>(
    isProfileComplete ? '/api/projects' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // Dedupe requests for 30 seconds
    }
  )

  const { data: applicationsData, error: applicationsError, isLoading: isLoadingApplications, mutate: mutateApplications } = useSWR<{ applications: Array<{ project: Project, appliedAt: string }> }>(
    userData?.crewProfile?.id ? `/api/crew/${userData.crewProfile.id}?applications` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // Dedupe requests for 30 seconds
    }
  )

  // Use SWR for fetching wishlists
  const { data: wishlistData, mutate: mutateWishlist } = useSWR(
    '/api/wishlist',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      onSuccess: (data) => {
        console.log('[CrewDashboard] Wishlist data loaded:', data?.wishlists?.length || 0)
      },
      onError: (error) => {
        console.error('[CrewDashboard] Error loading wishlist:', error)
      }
    }
  )

  // Use SWR for fetching network data
  const { data: networkRequestsData, mutate: mutateNetworkRequests, isLoading: isLoadingNetworkRequests } = useSWR(
    '/api/network/requests',
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 10000, // Refresh every 10 seconds
    }
  )

  const { data: networkConnectionsData, mutate: mutateNetworkConnections, isLoading: isLoadingConnections } = useSWR(
    '/api/network/connections',
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 10000, // Refresh every 10 seconds
    }
  )

  const projects = projectsData?.projects || []
  const appliedProjects = applicationsData?.applications.map(app => ({
    project: app.project,
    applicationDate: app.appliedAt
  })) || []
  const wishlists = wishlistData?.wishlists?.filter((w: any) => w.project !== null) || []
  const receivedRequests = networkRequestsData?.receivedRequests || []
  const sentRequests = networkRequestsData?.sentRequests || []
  const connections = networkConnectionsData?.connections || []
  
  // Calculate total network count (pending requests + established connections)
  const totalNetworkCount = (receivedRequests?.length || 0) + (sentRequests?.length || 0) + (connections?.length || 0)
  
  console.log('[CrewDashboard] Rendering with wishlists count:', wishlists.length)
  console.log('[CrewDashboard] Network data:', { 
    receivedRequests: receivedRequests?.length || 0, 
    sentRequests: sentRequests?.length || 0,
    connections: connections?.length || 0,
    totalNetworkCount: totalNetworkCount,
    isLoadingNetworkRequests,
    isLoadingConnections,
    networkRequestsData,
    networkConnectionsData
  })
  
  const isLoading = isLoadingProjects || isLoadingApplications
  const error = projectsError || applicationsError

  // Refresh projects after application
  const handleApplicationSuccess = () => {
    mutateProjects() // Revalidate projects data
    mutateApplications() // Revalidate applications data
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div className="mb-4 md:mb-0">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Crew Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Welcome back, <span className="font-semibold">{user?.name || 'Crew Member'}</span>!
          </p>

          {/* Trial Expiration Warning */}
          {userData?.crewProfile?.subscriptionTier === 'FREE_TRIAL' && userData.crewProfile.trialEnds && (
            <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.781.162 1.56 1.07 1.56 2.056v.448H12.8c.412 0 .781.336.781.777 0 .385-.227.727-.549.927-.103.052-.206.081-.309.081-.418 0-.79-.337-.79-.778 0-.417.377-.781.79-.781h1.072V5.147c0-.987-.78-1.895-1.787-2.056zM8.257 5.147H5.428c-.987 0-1.787.908-1.787 2.056v.772H3.07c-.783 0-1.42.626-1.42 1.417 0 .79.637 1.416 1.42 1.416h1.555v4.857c0 .987.78 1.895 1.787 2.056.986.162 1.786.97 1.786 2.056v-1.17H8.257c.412 0 .781-.336.781-.777 0-.385-.227-.727-.549-.927-.103-.052-.206-.081-.309-.081-.418 0-.79.337-.79.778 0 .417.377.781.79.781H5.428v1.17c0 1.075.893 1.981 1.981 1.981 1.088 0 1.981-.906 1.981-1.981v-1.17h1.555c.783 0 1.42-.626 1.42-1.417 0-.79-.637-1.416-1.42-1.416H8.257v-.772c0-.987-.78-1.895-1.787-2.056z" clipRule="evenodd" />
                </svg>
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">
                    Your free trial expires on {new Date(userData.crewProfile.trialEnds).toLocaleDateString()}
                  </p>
                  <p className="text-yellow-700">
                    Upgrade to continue using all features after your trial ends.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {isProfileComplete && (
          <div className="flex items-center space-x-4">
            {userData?.crewProfile?.subscriptionTier === 'PRO' && (
              <Badge variant="success" className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                ✓ Pro Member
              </Badge>
            )}
            {userData?.crewProfile?.subscriptionTier === 'BASIC' && (
              <Badge variant="success" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                Basic Member
              </Badge>
            )}
            {userData?.crewProfile?.subscriptionTier === 'FREE_TRIAL' && (
              <Badge variant="success" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                Free Trial
              </Badge>
            )}
            <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-100">
              <CheckCircle className="h-3 w-3 mr-1" />
              Profile Complete
            </Badge>
            <Link
              href="/crew/profile-setup"
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center"
            >
              Edit Profile
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Link>
          </div>
        )}
      </div>

      {/* Profile Completion Progress */}
      {hasProfile && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Profile Completion
            </span>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {calculateProfileCompletion()}% complete
            </span>
          </div>
          <Progress
            value={calculateProfileCompletion()}
            className="h-2"
            indicatorClassName={
              calculateProfileCompletion() < 50 ? 'bg-yellow-500' :
              calculateProfileCompletion() < 80 ? 'bg-blue-500' : 'bg-green-500'
            }
          />
          {!isProfileComplete && (
            <div className="mt-2 text-right">
              <Link
                href="/crew/profile-setup"
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-end"
              >
                Complete Your Profile
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      {userData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Overview */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                <div className="flex items-center space-x-4">
                  {userData.crewProfile?.photo ? (
                    <Avatar className="h-20 w-20 border-4 border-white">
                      <AvatarImage src={userData.crewProfile.photo} alt="Profile" />
                      <AvatarFallback>
                        {user?.name?.charAt(0) || userData.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <Avatar className="h-20 w-20 border-4 border-white bg-gray-200 text-gray-600">
                      <AvatarFallback className="text-2xl">
                        {user?.name?.charAt(0) || userData.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div>
                    <h2 className="text-xl font-semibold">{user?.name || 'Crew Member'}</h2>
                    <p className="text-indigo-100">{userData.email}</p>
                    {userData.crewProfile?.primaryRoles && userData.crewProfile.primaryRoles.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {userData.crewProfile.primaryRoles.slice(0, 2).map((role, index) => (
                          <Badge key={index} variant="secondary" className="bg-white/20 text-white hover:bg-white/20">
                            {role}
                          </Badge>
                        ))}
                        {userData.crewProfile.primaryRoles.length > 2 && (
                          <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/20">
                            +{userData.crewProfile.primaryRoles.length - 2} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Location */}
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm">
                      {userData.crewProfile?.city || 'Location not specified'}
                    </span>
                  </div>

                  {/* Experience */}
                  <div className="flex items-center">
                    <Briefcase className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm">
                      {userData.crewProfile?.yearsExperience || 'Experience not specified'}
                    </span>
                  </div>

                  {/* Availability */}
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm">
                      {formatAvailability(userData.crewProfile?.availability)}
                    </span>
                  </div>

                  {/* Travel */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <span className="text-sm mr-3">
                        {travelAvailable ? 'Willing to travel' : 'Travel preference not specified'}
                      </span>
                    </div>
                    {/* Toggle only for crew users */}
                    {userData.role === 'CREW' && (
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={travelAvailable}
                          onChange={(e) => handleTravelToggle(e.target.checked)}
                          disabled={savingTravel}
                          aria-label="Available to Travel"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    )}
                  </div>
                  {travelError && <p className="text-xs text-red-600 mt-1">{travelError}</p>}

                  {/* Availability date picker inline when toggled on */}
                  {showAvailabilityPicker && (
                    <div
                      className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 relative z-20 pointer-events-auto shadow-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">Select your availability dates</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex flex-col">
                          <label htmlFor="availabilityStart" className="text-xs text-gray-500 mb-1">Available From</label>
                          <input
                            id="availabilityStart"
                            type="date"
                            className="text-sm px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
                            value={availabilityStart ? new Date(availabilityStart).toISOString().slice(0,10) : ''}
                            onChange={(e) => setAvailabilityStart(e.target.value || null)}
                          />
                        </div>
                        <div className="flex flex-col">
                          <label htmlFor="availabilityEnd" className="text-xs text-gray-500 mb-1">Available Until</label>
                          <input
                            id="availabilityEnd"
                            type="date"
                            className="text-sm px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
                            value={availabilityEnd ? new Date(availabilityEnd).toISOString().slice(0,10) : ''}
                            onChange={(e) => setAvailabilityEnd(e.target.value || null)}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-3">
                        <button
                          type="button"
                          className="px-3 py-1 text-sm rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400"
                          onClick={() => setShowAvailabilityPicker(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-400"
                          onClick={handleSaveAvailabilityDates}
                          disabled={savingTravel}
                        >
                          {savingTravel ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="space-y-3">
                    <Link
                      href="/find-work"
                      className="block w-full text-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      Browse Projects
                    </Link>
                    <Link
                      href="/change-password"
                      className="block w-full text-center px-4 py-2 bg-gray-100 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      Change Password
                    </Link>
                    <Link
                      href="/crew/profile-setup"
                      className="block w-full text-center px-4 py-2 bg-gray-100 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      Edit Profile
                    </Link>
                    <Link
                      href="/browse-crew"
                      className="block w-full text-center px-4 py-2 bg-gray-100 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      Network with Crew
                    </Link>
                    <Link
                      href="/crew/wishlist"
                      className="block w-full text-center px-4 py-2 bg-gray-100 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      My Wishlist ({wishlists.length})
                    </Link>
                    <Link
                      href="/subscription-management"
                      className="block w-full text-center px-4 py-2 bg-gray-100 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      Manage Subscription
                    </Link>

                  {/* Subscription Upgrade Prompt */}
                  {userData?.crewProfile?.subscriptionTier === 'FREE_TRIAL' && (
                    <Link
                      href="/subscription-plans"
                      className="block w-full text-center px-4 py-2 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-md hover:bg-yellow-200 transition-colors border border-yellow-200"
                    >
                      Upgrade Subscription
                    </Link>
                  )}
                  {userData?.crewProfile?.subscriptionTier === 'BASIC' && (
                    <Link
                      href="/subscription-plans"
                      className="block w-full text-center px-4 py-2 bg-purple-100 text-purple-800 text-sm font-medium rounded-md hover:bg-purple-200 transition-colors border border-purple-200"
                    >
                      Go Pro for More Features
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Crew Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Crew Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: "Direction", icon: "🎬", role: "Director" },
                    { name: "Camera", icon: "🎥", role: "Director of Photography" },
                    { name: "Lighting", icon: "💡", role: "Gaffer" },
                    { name: "Art", icon: "🎨", role: "Art Director" },
                    { name: "Costume", icon: "👗", role: "Costume Designer" },
                    { name: "Makeup", icon: "💄", role: "Makeup Artist" },
                    { name: "Sound", icon: "🎤", role: "Sound Recordist" },
                    { name: "Production", icon: "📋", role: "Production Manager" }
                  ].map((category) => (
                    <Link
                      key={category.name}
                      href={`/browse-crew?role=${encodeURIComponent(category.role)}`}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center">
                        <span className="text-xl mr-2">{category.icon}</span>
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm">
                      {userData.crewProfile?.contactWhatsApp || 'Not specified'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">{userData.email}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center and Right Columns - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
<TabsList className="grid grid-cols-4 bg-gray-100 dark:bg-gray-800">
                <TabsTrigger value="dashboard" className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900">
                  <FileText className="h-4 w-4 mr-2" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="applications" className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Applications
                </TabsTrigger>
                <TabsTrigger value="wishlist" className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900">
                  <Heart className="h-4 w-4 mr-2" />
                  Wishlist
                </TabsTrigger>
                <TabsTrigger value="network" className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Network ({totalNetworkCount})
                </TabsTrigger>
              </TabsList>

              {/* Dashboard Tab */}
              <TabsContent value="dashboard" className="space-y-6">
                {/* Profile Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Users className="h-5 w-5 mr-2 text-indigo-600" />
                      Professional Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Primary Roles */}
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Primary Roles</p>
                        {userData.crewProfile?.primaryRoles && userData.crewProfile.primaryRoles.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {userData.crewProfile.primaryRoles.map((role, index) => (
                              <Badge key={index} variant="secondary" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 dark:bg-indigo-900 dark:text-indigo-200 dark:hover:bg-indigo-900">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 text-sm">Not specified</p>
                        )}
                      </div>

                      {/* Experience */}
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Experience</p>
                        <p className="font-medium dark:text-white">
                          {userData.crewProfile?.yearsExperience || 'Not specified'}
                        </p>
                      </div>

                      {/* Project Types */}
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Project Types</p>
                        {userData.crewProfile?.projectTypes && userData.crewProfile.projectTypes.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {userData.crewProfile.projectTypes.map((type, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 text-sm">Not specified</p>
                        )}
                      </div>

                      {/* Languages */}
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Languages</p>
                        {userData.crewProfile?.languages && userData.crewProfile.languages.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {userData.crewProfile.languages.map((lang, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {lang}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 text-sm">Not specified</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Availability Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
                      Availability Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Available From</p>
                        <p className="font-medium dark:text-white">
                          {userData.crewProfile?.availabilityStart ? formatDate(userData.crewProfile.availabilityStart) : 'Not specified'}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Available Until</p>
                        <p className="font-medium dark:text-white">
                          {userData.crewProfile?.availabilityEnd ? formatDate(userData.crewProfile.availabilityEnd) : 'Not specified'}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Daily Budget Range</p>
                        <p className="font-medium dark:text-white">
                          {userData.crewProfile?.dailyBudgetMin && userData.crewProfile?.dailyBudgetMax ? (
                            `₹${userData.crewProfile.dailyBudgetMin.toLocaleString()} - ₹${userData.crewProfile.dailyBudgetMax.toLocaleString()}`
                          ) : userData.crewProfile?.dailyBudgetMin ? (
                            `₹${userData.crewProfile.dailyBudgetMin.toLocaleString()}+`
                          ) : userData.crewProfile?.dailyBudgetMax ? (
                            `Up to ₹${userData.crewProfile.dailyBudgetMax.toLocaleString()}`
                          ) : (
                            'Not specified'
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Portfolio Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Portfolio & Links
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userData.crewProfile?.portfolioLinks && userData.crewProfile.portfolioLinks.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Portfolio Links</p>
                        <div className="space-y-2">
                          {userData.crewProfile.portfolioLinks.map((link, index) => (
                            <div key={index} className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm break-all"
                              >
                                {getHostnameFromUrl(link)}
                              </a>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-indigo-500 dark:text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 100-2H5z" />
                              </svg>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <AlertTriangle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">No portfolio links added</p>
                        <Link
                          href="/crew/profile-setup"
                          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mt-2 inline-block"
                        >
                          Add portfolio links
                        </Link>
                      </div>
                    )}

                    {userData.crewProfile?.imdbLink ? (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">IMDb Profile</p>
                          <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <a
                              href={userData.crewProfile.imdbLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm break-all"
                            >
                              {getHostnameFromUrl(userData.crewProfile.imdbLink || '')}
                            </a>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-indigo-500 dark:text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 100-2H5z" />
                            </svg>
                          </div>
                      </div>
                    ) : (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center py-4">
                        <AlertTriangle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">No IMDb profile added</p>
                        <Link
                          href="/crew/profile-setup"
                          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mt-2 inline-block"
                        >
                          Add IMDb profile
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Subscription Plan Card */}
                {userData.crewProfile?.subscriptionTier && (
                  <CrewSubscriptionCard 
                    subscriptionTier={userData.crewProfile.subscriptionTier as 'FREE_TRIAL' | 'BASIC' | 'PRO'}
                    trialEnds={userData.crewProfile.trialEnds}
                  />
                )}
              </TabsContent>

              {/* Applications Tab */}
              <TabsContent value="applications" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                      Your Applications
                    </CardTitle>
                    <Button
                      onClick={() => {
                        console.log('[CrewDashboard] Refreshing applications...');
                        mutateApplications();
                      }}
                      variant="outline"
                      size="sm"
                      disabled={isLoadingApplications}
                      className="gap-1"
                    >
                      {isLoadingApplications ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Refreshing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          Refresh
                        </>
                      )}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600 mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-300">Loading your applications...</p>
                      </div>
                    ) : appliedProjects.length > 0 ? (
                      <div className="space-y-4">
                        {appliedProjects.map((app) => (
                          <Card key={app.project.id} className="border-l-4 border-green-500">
                            <CardContent className="pt-6">
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900 dark:text-white text-lg">{app.project.projectName}</h4>
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {app.project.projectType}
                                    </Badge>
                                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      {app.project.location}
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                    Applied on: {formatDate(app.applicationDate)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-200">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Applied
                                  </Badge>
<Link
  href={`/projects/${slugifyName(app.project.projectName)}`}
  className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
>
  View Details
</Link>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No applications yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">You haven&#39;t applied to any projects yet.</p>
                        <Link
                          href="/find-work"
                          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                        >
                          Browse Projects
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Wishlist Tab */}
              <TabsContent value="wishlist" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      <Heart className="h-5 w-5 mr-2 text-indigo-600" />
                      Saved Projects
                    </CardTitle>
                    <Button
                      onClick={() => {
                        console.log('[CrewDashboard] Refreshing wishlist...');
                        mutateWishlist();
                      }}
                      variant="outline"
                      size="sm"
                      className="gap-1"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {wishlists.length > 0 ? (
                      <div className="space-y-4">
                        {wishlists.map((wishlist: any) => (
                          <Card key={wishlist.id} className="border-l-4 border-red-500">
                            <CardContent className="pt-6">
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900 dark:text-white text-lg">{wishlist.project.projectName}</h4>
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {wishlist.project.projectType}
                                    </Badge>
                                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      {wishlist.project.location}
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                    Saved on: {formatDate(wishlist.createdAt)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Link
                                    href={`/projects/${slugifyName(wishlist.project.projectName)}`}
                                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                                  >
                                    View Details
                                  </Link>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No saved projects yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">You haven&#39;t saved any projects to your wishlist yet.</p>
                        <Link
                          href="/find-work"
                          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                        >
                          Browse Projects
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Network Tab */}
              <TabsContent value="network" className="space-y-6">
                {/* Connection Requests */}
                {receivedRequests.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <UserPlus className="h-5 w-5 mr-2 text-indigo-600" />
                        Connection Requests ({receivedRequests.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {receivedRequests.map((request: any) => (
                          <ConnectionRequestCard
                            key={request.id}
                            request={request}
                            onRespond={() => {
                              mutateNetworkRequests()
                              mutateNetworkConnections()
                            }}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Sent Requests */}
                {sentRequests.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Clock className="h-5 w-5 mr-2 text-gray-600" />
                        Pending Requests ({sentRequests.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {sentRequests.map((request: any) => (
                          <div key={request.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium">{request.receiver.name}</p>
                              {request.receiver.crewProfile?.city && (
                                <p className="text-sm text-gray-500">{request.receiver.crewProfile.city}</p>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              Pending
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Connections */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      <Users className="h-5 w-5 mr-2 text-indigo-600" />
                      My Network ({connections.length})
                    </CardTitle>
                    <Button
                      onClick={() => {
                        console.log('[CrewDashboard] Refreshing network...');
                        mutateNetworkConnections();
                        mutateNetworkRequests();
                      }}
                      variant="outline"
                      size="sm"
                      disabled={isLoadingConnections || isLoadingNetworkRequests}
                      className="gap-1"
                    >
                      {(isLoadingConnections || isLoadingNetworkRequests) ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Refreshing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          Refresh
                        </>
                      )}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <NetworkList connections={connections} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto p-6 bg-red-50 rounded-lg border border-red-200 dark:bg-red-900/10 dark:border-red-800">
          <div className="flex flex-col items-center text-center">
            <div className="bg-red-100 p-3 rounded-full mb-4 dark:bg-red-900/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-red-800 dark:text-red-400 mb-2">Profile Error</h3>
            <p className="text-red-600 dark:text-red-400 text-sm mb-6 max-w-md">
              We could not load your profile data. Please try refreshing the page or contact support if the issue persists.
            </p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Page
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
