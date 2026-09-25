'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { slugifyName } from '@/lib/utils'

import { useSession } from '@/lib/auth/session-context'
import { Button } from '@/components/ui/button'

import { Badge } from '@/components/ui/badge'
import { MapPin, Calendar, Users, CheckCircle, ArrowLeft, Building2, Film, AlertCircle, TrendingUp } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ApplyModal } from '@/components/applications/ApplyModal'

interface Project {
  id: string
  projectName: string
  projectType: string
  rolesNeeded: Array<string | { role: string, count?: number }>
  shootStartDate: string
  shootEndDate: string
  location: string
  description: string
  questions: Array<string | { question: string }>
  employer: {
    user: {
      name: string
      image?: string | null
    }
  }
  _count: {
    applications: number
  }
}



export default function ProjectDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasApplied, setHasApplied] = useState<boolean>(false)
  const [showApplyModal, setShowApplyModal] = useState(false)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${params.id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch project details')
        }
        const data = await response.json()
        setProject(data.project)

        // Check if user has already applied to this project
        if (session?.user?.id) {
          const checkResponse = await fetch(`/api/projects/${params.id}/apply`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          })

          if (checkResponse.ok) {
            const result = await checkResponse.json()
            setHasApplied(result.hasApplied || false)
          }
        }
      } catch (err) {
        console.error('Error fetching project:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch project details')
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchProject()
    }
  }, [params.id, session?.user?.id])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const calculateDaysUntilStart = (startDate: string) => {
    const start = new Date(startDate)
    const today = new Date()
    const diffTime = start.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = end.getTime() - start.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading project details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Project</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.push('/dashboard')} className="bg-indigo-600 hover:bg-indigo-700">
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Film className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h1>
          <p className="text-gray-600 mb-6">This project may have been removed or doesn&apos;t exist.</p>
          <Button onClick={() => router.push('/dashboard')} className="bg-indigo-600 hover:bg-indigo-700">
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

    const daysUntilStart = calculateDaysUntilStart(project.shootStartDate)
    const projectDuration = calculateDuration(project.shootStartDate, project.shootEndDate)

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => router.push('/find-work')}
          className="mb-6 hover:bg-white shadow-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Find Work
        </Button>

        {/* Project Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Film className="h-6 w-6 text-white" />
                  <Badge className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm">
                    {project.projectType}
                  </Badge>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {project.projectName}
                </h1>
                <div className="flex items-center gap-4 text-indigo-100">
                  <span className="flex items-center gap-1 text-sm">
                    <Building2 className="h-4 w-4" />
                    {project.employer.user.name}
                  </span>
                  <span className="flex items-center gap-1 text-sm">
                    <Users className="h-4 w-4" />
                    {project._count.applications} {project._count.applications === 1 ? 'applicant' : 'applicants'}
                  </span>
                </div>
              </div>
              {daysUntilStart > 0 && daysUntilStart <= 30 && (
                <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                  <p className="text-xs text-indigo-100">Starts in</p>
                  <p className="text-2xl font-bold text-white">{daysUntilStart}</p>
                  <p className="text-xs text-indigo-100">days</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-4 rounded-xl border border-indigo-200">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-indigo-600" />
                  <p className="text-xs font-medium text-indigo-600">Location</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">{project.location}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-4 rounded-xl border border-purple-200">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  <p className="text-xs font-medium text-purple-600">Duration</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">{projectDuration} days</p>
              </div>
              <div className="bg-gradient-to-br from-pink-50 to-pink-100/50 p-4 rounded-xl border border-pink-200">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-pink-600" />
                  <p className="text-xs font-medium text-pink-600">Roles</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">{project.rolesNeeded.length} positions</p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 rounded-xl border border-amber-200">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-amber-600" />
                  <p className="text-xs font-medium text-amber-600">Interest</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">{project._count.applications} applied</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></div>
                    Project Overview
                  </h3>
                  <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">{project.description}</p>
                </div>

                {/* Roles Needed */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></div>
                    Roles We&apos;re Looking For
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {project.rolesNeeded.map((roleItem) => (
                      <Badge
                        key={typeof roleItem === 'string' ? roleItem : JSON.stringify(roleItem)}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 px-4 py-2 text-sm"
                      >
                        <Users className="h-3 w-3 mr-1.5" />
                        {typeof roleItem === 'string' ? roleItem : roleItem.role}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Timeline */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                    Timeline
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Start Date</p>
                      <p className="text-sm font-semibold text-gray-900">{formatDate(project.shootStartDate)}</p>
                    </div>
                    <div className="border-t border-gray-300 pt-3">
                      <p className="text-xs text-gray-500 mb-1">End Date</p>
                      <p className="text-sm font-semibold text-gray-900">{formatDate(project.shootEndDate)}</p>
                    </div>
                  </div>
                </div>

                {/* Employer Info */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-xl border border-indigo-200">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-indigo-600" />
                    Posted By
                  </h4>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16">
                      {project.employer.user.image ? (
                        <AvatarImage src={project.employer.user.image} alt={project.employer.user.name} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                      ) : null}
                      <AvatarFallback>{project.employer.user.name?.slice(0,1).toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-gray-900">{project.employer.user.name}</p>
                      <p className="text-xs text-gray-500">Employer</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Questions Section */}
        {project.questions && project.questions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-5">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <AlertCircle className="h-6 w-6 mr-2" />
                Application Questions
              </h2>
              <p className="text-indigo-100 text-sm mt-1">You&apos;ll be asked to answer these when applying</p>
            </div>

            <div className="p-8">
              <div className="space-y-4">
                {project.questions.map((questionItem, index) => (
                  <div key={index} className="group relative">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                        {index + 1}
                      </div>
                      <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200 group-hover:border-indigo-300 group-hover:shadow-md transition-all duration-200">
                        <p className="font-medium text-gray-900 leading-relaxed">
                          {typeof questionItem === 'string' ? questionItem : questionItem.question}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Apply Button - Show for non-logged in users and crew members, but not employers */}
        {session?.user?.role !== 'EMPLOYER' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Ready to Apply?</h3>
                <p className="text-gray-600 text-sm">
                  {!session ? 'Sign in to submit your application and showcase your skills' : 'Submit your application and showcase your skills'}
                </p>
              </div>
              {hasApplied ? (
                <Button
                  variant="outline"
                  disabled
                  className="bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 hover:bg-green-50 border-green-300 text-base py-6 px-8 rounded-xl shadow-sm"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Application Submitted
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    if (!session) {
                      // Redirect to accounts page with crew signin tab
                      router.push('/accounts?tab=signin&role=crew')
                    } else if (session.user.role === 'CREW') {
                      setShowApplyModal(true)
                    }
                  }}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-base py-6 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {!session ? 'Sign In to Apply' : 'Apply Now'}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Apply Modal */}
        {showApplyModal && project && (
          <ApplyModal
            project={{
              id: project.id,
              projectName: project.projectName,
              description: project.description,
              location: project.location,
              shootStartDate: project.shootStartDate,
              shootEndDate: project.shootEndDate,
              rolesNeeded: project.rolesNeeded.map(roleItem =>
                typeof roleItem === 'string' ? roleItem : roleItem.role
              ),
              questions: project.questions.map(questionItem =>
                typeof questionItem === 'string' ? questionItem : questionItem.question
              )
            }}
            onClose={() => setShowApplyModal(false)}
            onSuccess={() => {
              setHasApplied(true)
              setShowApplyModal(false)
            }}
          />
        )}
      </div>
    </div>
  )
}
