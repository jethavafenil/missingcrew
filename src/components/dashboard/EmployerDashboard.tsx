'use client'

import React, { useState, useEffect } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, MapPin, Briefcase, DollarSign, Users, Clock, CheckCircle, AlertTriangle, FileText, Phone, Building2, Globe, User, Mail, Check, X, MessageSquare, UserPlus, Search, RefreshCw, Heart } from 'lucide-react'
import { CrewSlider } from '@/components/crew/CrewSlider'
import { NetworkCrewSlider } from '@/components/network/NetworkCrewSlider'
import { slugifyName } from '@/lib/utils'
import { swrFetcher } from '@/lib/swr'

interface EmployerUserData {
  email: string
  name?: string
  role?: string
  employerProfile?: {
    id?: string
    userId?: string
    companyName?: string | null
    companyWebsite?: string | null
    completed?: boolean
    createdAt?: string
    updatedAt?: string
    projects?: Project[]
    [key: string]: unknown
  }
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
  status: string
  applications: Array<{
    id: string
    crew: {
      id: string
      user: {
        name: string
      }
      primaryRoles?: string[]
      yearsExperience?: string
      city?: string
    }
    appliedAt: string
    answers: string[]
  }>
}

interface EmployerDashboardProps {
  user: { name?: string } | null
  userData?: EmployerUserData | null
}

// Fetcher function for SWR
const fetcher: (url: string) => Promise<any> = swrFetcher

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

export function EmployerDashboard({ user, userData }: EmployerDashboardProps) {
  // Check if user has completed their profile
  const hasProfile = userData?.employerProfile && Object.keys(userData.employerProfile).length > 0
  // Check if profile is complete by checking if required fields are filled
  const isProfileComplete = hasProfile && userData.employerProfile?.completed
  
  console.log('[EmployerDashboard] Profile status:', {
    hasProfile,
    isProfileComplete,
    completed: userData?.employerProfile?.completed
  })

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    if (!userData?.employerProfile) return 0

    const profile = userData.employerProfile
    const totalFields = 2 // Total number of fields we're checking
    let completedFields = 0

    // Check each field
    if (profile.companyName) completedFields++
    if (profile.companyWebsite) completedFields++

    return Math.round((completedFields / totalFields) * 100)
  }

  // State for projects and applications
  const [activeTab, setActiveTab] = useState('dashboard')

  // Use SWR for fetching projects with automatic caching and revalidation
  // Always fetch to enable refresh, use initial data from server-side props
  const { data: projectsData, error, isLoading, mutate: mutateProjects } = useSWR<{ projects: Project[] }>(
    '/api/employer/projects',
    fetcher,
    {
      fallbackData: userData?.employerProfile?.projects ? { projects: userData.employerProfile.projects } : undefined,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // Dedupe requests for 30 seconds
    }
  )

  // Connections for Hire Now tab (accepted connections)
  const { data: connectionsData, isLoading: isConnectionsLoading } = useSWR<{ connections: any[] }>(
    '/api/network/connections',
    fetcher,
    { revalidateOnFocus: false }
  )

  // Use SWR for fetching wishlists - fetch regardless of profile completion
  const { data: wishlistData, mutate: mutateWishlist } = useSWR(
    '/api/wishlist',  // Always fetch wishlist if user is logged in
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      onSuccess: (data) => {
        console.log('[EmployerDashboard] Wishlist data loaded:', data?.wishlists?.length || 0)
      },
      onError: (error) => {
        console.error('[EmployerDashboard] Error loading wishlist:', error)
      }
    }
  )

  const projects = projectsData?.projects || []
  const wishlists = wishlistData?.wishlists || []
  
  console.log('[EmployerDashboard] Projects count:', projects.length)
  console.log('[EmployerDashboard] Profile complete:', isProfileComplete)
  console.log('[EmployerDashboard] Error:', error)
  
  console.log('[EmployerDashboard] Rendering with wishlists count:', wishlists.length)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div className="mb-4 md:mb-0">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Employer Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Welcome back, <span className="font-semibold">{user?.name || 'Employer'}</span>!
          </p>
        </div>

        {isProfileComplete && (
          <div className="flex items-center space-x-4">
            <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-100">
              <CheckCircle className="h-3 w-3 mr-1" />
              Profile Complete
            </Badge>
            <Link
              href="/employer/edit-profile"
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
                href="/employer/profile-setup"
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
                  <Avatar className="h-20 w-20 border-4 border-white bg-gray-200 text-gray-600">
                    <AvatarFallback className="text-2xl">
                      {user?.name?.charAt(0) || userData.email.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-semibold">{user?.name || 'Employer'}</h2>
                    <p className="text-indigo-100">{userData.email}</p>
                    {userData.employerProfile?.companyName && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">{userData.employerProfile.companyName}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Company Info */}
                  <div className="flex items-center">
                    <Building2 className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm">
                      {userData.employerProfile?.companyName || 'Company not specified'}
                    </span>
                  </div>

                  {/* Website */}
                  {userData.employerProfile?.companyWebsite && (
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 text-gray-500 mr-2" />
                      <a
                        href={userData.employerProfile.companyWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:underline"
                      >
                        {new URL(userData.employerProfile.companyWebsite).hostname}
                      </a>
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
                    href="/employer/post-requirement"
                    className="block w-full text-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Post New Project
                  </Link>
                  <Link
                    href="/browse-crew"
                    className="block w-full text-center px-4 py-2 bg-gray-100 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    Browse Crew Members
                  </Link>
                  <Link
                    href="/employer/wishlist"
                    className="block w-full text-center px-4 py-2 bg-gray-100 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    My Wishlist ({wishlists.length})
                  </Link>
                  <Link
                    href="/change-password"
                    className="block w-full text-center px-4 py-2 bg-gray-100 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    Change Password
                  </Link>
                  <Link
                    href="/employer/edit-profile"
                    className="block w-full text-center px-4 py-2 bg-gray-100 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    Edit Profile
                  </Link>
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
                    <Mail className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm">
                      {userData.email}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center and Right Columns - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid grid-cols-5 bg-gray-100 dark:bg-gray-800">
                <TabsTrigger value="dashboard" className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900">
                  <FileText className="h-4 w-4 mr-2" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="projects" className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Projects
                </TabsTrigger>
                <TabsTrigger value="applications" className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900">
                  <Users className="h-4 w-4 mr-2" />
                  Applications
                </TabsTrigger>
                <TabsTrigger value="wishlist" className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900">
                  <Heart className="h-4 w-4 mr-2" />
                  Wishlist
                </TabsTrigger>
                <TabsTrigger value="hire" className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Hire Now
                </TabsTrigger>
              </TabsList>

              {/* Dashboard Tab */}
              <TabsContent value="dashboard" className="space-y-6">
                {/* Company Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Building2 className="h-5 w-5 mr-2 text-indigo-600" />
                      Company Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Company Name</p>
                        <p className="font-medium dark:text-white">
                          {userData.employerProfile?.companyName || 'Not specified'}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Company Website</p>
                        {userData.employerProfile?.companyWebsite ? (
                          <a
                            href={userData.employerProfile.companyWebsite}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm break-all"
                          >
                            {new URL(userData.employerProfile.companyWebsite).hostname}
                          </a>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 text-sm">Not specified</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Profile Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-indigo-600" />
                      Profile Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {userData.employerProfile?.createdAt && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-green-500 mr-2" />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Profile Created</p>
                            <p className="font-medium dark:text-white">
                              {formatDate(userData.employerProfile.createdAt)}
                            </p>
                          </div>
                        </div>
                      )}

                      {userData.employerProfile?.updatedAt && (
                        <div className="flex items-center">
                          <RefreshCw className="h-4 w-4 text-blue-500 mr-2" />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
                            <p className="font-medium dark:text-white">
                              {formatDate(userData.employerProfile.updatedAt)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="projects" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      <Briefcase className="h-5 w-5 mr-2 text-indigo-600" />
                      Your Projects
                    </CardTitle>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => {
                          console.log('[EmployerDashboard] Refreshing projects...');
                          mutateProjects();
                        }}
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                        className="gap-1"
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Refreshing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4" />
                            Refresh Projects
                          </>
                        )}
                      </Button>
                      <Link
                        href="/employer/post-requirement"
                        className="inline-flex items-center px-3 py-1 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Post New Project
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {error && (
                      <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                        <p className="text-sm text-red-600 dark:text-red-400">
                          Error loading projects: {error.message || 'Unknown error'}
                        </p>
                        <button
                          onClick={() => mutateProjects()}
                          className="mt-2 text-sm text-red-600 dark:text-red-400 underline hover:no-underline"
                        >
                          Try again
                        </button>
                      </div>
                    )}

                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <RefreshCw className="h-12 w-12 animate-spin text-indigo-600 mb-4" />
                        <p className="text-gray-600 dark:text-gray-300">Loading projects...</p>
                      </div>
                    ) : projects.length > 0 ? (
                      <div className="space-y-4">
                        {projects.map((project: Project) => (
                          <Card key={project.id} className="border-l-4 border-indigo-500">
                            <CardContent className="pt-6">
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-gray-900 dark:text-white text-lg">{project.projectName}</h4>
                                    <Badge
                                      variant={project.status === 'OPEN' ? 'success' :
                                               project.status === 'CLOSED' ? 'destructive' : 'secondary'}
                                      className={project.status === 'OPEN' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                                                 project.status === 'CLOSED' ? 'bg-red-100 text-red-800 hover:bg-red-100' :
                                                 'bg-blue-100 text-blue-800 hover:bg-blue-100'}
                                    >
                                      {project.status}
                                    </Badge>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2 mb-3">
                                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      {project.location}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                      <Calendar className="h-3 w-3 mr-1" />
                                      {formatDate(project.shootStartDate)} to {formatDate(project.shootEndDate)}
                                    </div>
                                  </div>

                                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                                    {project.description}
                                  </p>
                                </div>

                                <div className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-2">
                                  <Link
                                    href={`/projects/${slugifyName(project.projectName)}`}
                                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center"
                                  >
                                    <Search className="h-3 w-3 mr-1" />
                                    View Details
                                  </Link>
                                  <Link
                                    href={`/employer/post-requirement?id=${project.id}`}
                                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit Project
                                  </Link>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No projects yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">You haven&#39;t posted any projects yet.</p>
                        <Link
                          href="/employer/post-requirement"
                          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Post Your First Project
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Applications Tab */}
              <TabsContent value="applications" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      <Users className="h-5 w-5 mr-2 text-indigo-600" />
                      All Applications
                    </CardTitle>
                    <Button
                      onClick={() => {
                        console.log('[EmployerDashboard] Refreshing applications...');
                        mutateProjects();
                      }}
                      variant="outline"
                      size="sm"
                      disabled={isLoading}
                      className="gap-1"
                    >
                      {isLoading ? (
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
                        <RefreshCw className="h-12 w-12 animate-spin text-indigo-600 mb-4" />
                        <p className="text-gray-600 dark:text-gray-300">Loading applications...</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {projects.filter(project => project.applications.length > 0).length > 0 ? (
                          projects
                            .filter(project => project.applications.length > 0)
                            .map(project => (
                              <div key={project.id} className="space-y-4">
                                <h3 className="font-medium text-gray-900 dark:text-white text-lg mb-2">
                                  {project.projectName}
                                </h3>

                                {project.applications.map(application => (
                                  <Card key={application.id} className="border-l-4 border-green-500 mb-4">
                                    <CardContent className="pt-6">
                                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div className="flex-1">
                                          <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-medium text-gray-900 dark:text-white">
                                              {application.crew.user.name}
                                            </h4>
                                            <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-200">
                                              <Check className="h-3 w-3 mr-1" />
                                              Applied
                                            </Badge>
                                          </div>

                                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                            Applied on {formatDate(application.appliedAt)}
                                          </p>

                                          <div className="flex flex-wrap items-center gap-2 mb-3">
                                            {application.crew.primaryRoles && application.crew.primaryRoles.length > 0 && (
                                              <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 dark:bg-indigo-900 dark:text-indigo-200">
                                                {application.crew.primaryRoles[0]}
                                                {application.crew.primaryRoles.length > 1 && ` +${application.crew.primaryRoles.length - 1}`}
                                              </Badge>
                                            )}

                                            {application.crew.yearsExperience && (
                                              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                <Briefcase className="h-3 w-3 mr-1" />
                                                {application.crew.yearsExperience}
                                              </div>
                                            )}

                                            {application.crew.city && (
                                              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                <MapPin className="h-3 w-3 mr-1" />
                                                {application.crew.city}
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        <div className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-2">
                                          <Link
                                            href={`/crew/${slugifyName(application.crew.user.name)}`}
                                            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center"
                                          >
                                            <User className="h-3 w-3 mr-1" />
                                            View Profile
                                          </Link>
                                          <button
                                            className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 flex items-center"
                                            onClick={() => alert('Messaging functionality will be implemented soon')}
                                          >
                                            <MessageSquare className="h-3 w-3 mr-1" />
                                            Message
                                          </button>
                                        </div>
                                      </div>

                                      {application.answers && application.answers.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Application Answers
                                          </h5>
                                          <div className="space-y-3">
                                            {application.answers.map((answer: string, index: number) => (
                                              <div key={index} className="text-sm">
                                                <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                  {project.questions[index]}
                                                </p>
                                                <p className="text-gray-600 dark:text-gray-400">{answer}</p>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            ))
                        ) : (
                          <div className="text-center py-12">
                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No applications yet</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">
                              You haven&#39;t received any applications for your projects yet.
                            </p>
                            <Link
                              href="/employer/post-requirement"
                              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Post a New Project
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Hire Now Tab */}
              <TabsContent value="hire" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      <UserPlus className="h-5 w-5 mr-2 text-indigo-600" />
                      Hire Now
                    </CardTitle>
                    <Link
                      href="/employer/post-requirement"
                      className="inline-flex items-center px-3 py-1 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Post Requirement
                    </Link>
                  </CardHeader>
                  <CardContent>
                    {isConnectionsLoading ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <RefreshCw className="h-12 w-12 animate-spin text-indigo-600 mb-4" />
                        <p className="text-gray-600 dark:text-gray-300">Loading connections...</p>
                      </div>
                    ) : connectionsData?.connections && connectionsData.connections.length > 0 ? (
                      <NetworkCrewSlider connections={connectionsData.connections} />
                    ) : (
                      <div className="text-center py-12">
                        <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No accepted connections yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">Connect with crew from profiles to see them here, or post a requirement.</p>
                        <div className="flex items-center justify-center gap-3">
                          <Link
                            href="/browse-crew"
                            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                          >
                            <Search className="h-4 w-4 mr-1" />
                            Browse Crew
                          </Link>
                          <Link
                            href="/employer/post-requirement"
                            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Post Requirement
                          </Link>
                        </div>
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
                      Saved Crew Members
                    </CardTitle>
                    <Button
                      onClick={() => {
                        console.log('[EmployerDashboard] Refreshing wishlist...');
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
                      <div className="grid gap-4 md:grid-cols-2">
                        {wishlists.map((wishlist: any) => (
                          <Card key={wishlist.id} className="border-l-4 border-red-500">
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                  <Avatar className="h-12 w-12">
                                    {wishlist.crew.photo ? (
                                      <AvatarImage src={wishlist.crew.photo} alt={wishlist.crew.user.name} />
                                    ) : null}
                                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                                      {wishlist.crew.user.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                      {wishlist.crew.user.name}
                                    </h4>
                                    {wishlist.crew.primaryRoles && wishlist.crew.primaryRoles.length > 0 && (
                                      <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {Array.isArray(wishlist.crew.primaryRoles) 
                                          ? wishlist.crew.primaryRoles[0] 
                                          : 'N/A'}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={async () => {
                                    try {
                                      await fetch(`/api/wishlist?crewId=${wishlist.crew.id}`, {
                                        method: 'DELETE',
                                      })
                                      mutateWishlist()
                                    } catch (error) {
                                      console.error('Error removing from wishlist:', error)
                                    }
                                  }}
                                  className="text-red-500 hover:text-red-700 transition-colors"
                                  title="Remove from wishlist"
                                >
                                  <Heart className="h-5 w-5 fill-current" />
                                </button>
                              </div>

                              <div className="space-y-2 mb-4">
                                {wishlist.crew.city && (
                                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {wishlist.crew.city}
                                  </div>
                                )}
                                {wishlist.crew.yearsExperience && (
                                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                    <Briefcase className="h-3 w-3 mr-1" />
                                    {wishlist.crew.yearsExperience}
                                  </div>
                                )}
                                {(wishlist.crew.dailyBudgetMin || wishlist.crew.dailyBudgetMax) && (
                                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                    <DollarSign className="h-3 w-3 mr-1" />
                                    {wishlist.crew.dailyBudgetMin && wishlist.crew.dailyBudgetMax
                                      ? `₹${wishlist.crew.dailyBudgetMin.toLocaleString()} - ₹${wishlist.crew.dailyBudgetMax.toLocaleString()}/day`
                                      : wishlist.crew.dailyBudgetMin
                                      ? `From ₹${wishlist.crew.dailyBudgetMin.toLocaleString()}/day`
                                      : `Up to ₹${wishlist.crew.dailyBudgetMax.toLocaleString()}/day`}
                                  </div>
                                )}
                              </div>

                              <div className="flex space-x-2">
                                <Link
                                  href={`/crew/${slugifyName(wishlist.crew.user.name)}`}
                                  className="flex-1 text-center px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                                >
                                  View Profile
                                </Link>
                                {wishlist.crew.user.email && (
                                  <a
                                    href={`mailto:${wishlist.crew.user.email}`}
                                    className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    title="Send email"
                                  >
                                    <Mail className="h-4 w-4" />
                                  </a>
                                )}
                                {wishlist.crew.user.phone && (
                                  <a
                                    href={`tel:${wishlist.crew.user.phone}`}
                                    className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    title="Call"
                                  >
                                    <Phone className="h-4 w-4" />
                                  </a>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          No saved crew members yet
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                          Start building your list of favorite crew members by clicking the heart icon on crew profiles.
                        </p>
                        <Link
                          href="/browse-crew"
                          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                        >
                          <Search className="h-4 w-4 mr-1" />
                          Browse Crew
                        </Link>
                      </div>
                    )}
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
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
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
              <RefreshCw className="h-4 w-4" />
              Refresh Page
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
