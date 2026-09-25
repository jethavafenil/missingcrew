'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/lib/auth/session-context'
import { useRouter } from 'next/navigation'
import { slugifyName } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ApplyModal } from '@/components/applications/ApplyModal'
import { CheckCircle, MapPin, Calendar, Film, Users, User, Check, ExternalLink, Heart } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface Project {
  id: string
  projectName: string
  projectType: string
  rolesNeeded: Array<string | { role: string, count?: number }>
  shootStartDate: string
  shootEndDate: string
  location: string
  description: string
  questions: string[]
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

interface ProjectCardProps {
  project: Project
  onApply?: () => void
}

export function ProjectCard({ project, onApply }: ProjectCardProps) {
  const [employerImgVisible, setEmployerImgVisible] = useState(!!project.employer.user.image)

  const { data: session } = useSession()
  const router = useRouter()
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isWishlistLoading, setIsWishlistLoading] = useState(false)
  const [isApplying, setIsApplying] = useState(false)

  useEffect(() => {
    const checkApplicationStatus = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch(`/api/projects/${project.id}/apply`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          })

          if (response.ok) {
            const result = await response.json()
            setHasApplied(result.hasApplied || false)
          }
        } catch (error) {
          console.error('Error checking application status:', error)
        }
      }
    }

    const checkWishlistStatus = async () => {
      if (session?.user?.id && session?.user?.role === 'CREW') {
        try {
          const response = await fetch(`/api/wishlist/check?projectId=${project.id}`)
          if (response.ok) {
            const data = await response.json()
            setIsWishlisted(data.isWishlisted)
          }
        } catch (error) {
          console.error('Error checking wishlist status:', error)
        }
      }
    }

    checkApplicationStatus()
    checkWishlistStatus()
  }, [project.id, session?.user?.id, session?.user?.role])

  const handleApply = async () => {
    if (isApplying) return;
    setIsApplying(true);
    if (!session) {
      // Redirect guests to sign in as crew before applying
      router.push(`/accounts?tab=signin&role=crew`)
      setIsApplying(false)
      return
    }

    // Check if user is a crew member
    if (session.user.role === 'CREW') {
      try {
        // Fetch user data to check subscription status
        const response = await fetch(`/api/user/profile`)
        if (response.ok) {
          const userData = await response.json()

          // Check if user has a crew profile
          if (!userData.crewProfile) {
            // Redirect to crew profile setup if no profile exists
            router.push('/crew/profile-setup')
            return
          }

          // Check subscription status
          const subscriptionTier = userData.crewProfile?.subscriptionTier

          // If free trial, check if trial has expired
          if (subscriptionTier === 'FREE_TRIAL' && userData.crewProfile?.trialEnds) {
            const trialEndDate = new Date(userData.crewProfile.trialEnds)
            const today = new Date()

            if (trialEndDate < today) {
              // Trial has expired
              router.push('/subscription-plans?expired=true')
              return
            }
          }
        } else {
          // If there's an error fetching the profile, redirect to profile setup
          router.push('/crew/profile-setup')
          return
        }
      } catch (error) {
        console.error('Error checking subscription status:', error)
        // If there's an error, redirect to profile setup
        router.push('/crew/profile-setup')
        return
      }
    } else if (session.user.role === 'EMPLOYER') {
      // If user is an employer, redirect to employer dashboard
      router.push('/employer/dashboard')
      setIsApplying(false)
      return
    }

    setShowApplyModal(true)
    setIsApplying(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const options = { month: 'short', day: 'numeric', year: 'numeric' } as const
    return date.toLocaleDateString('en-US', options)
  }

  const formatDateRange = () => {
    const startDate = new Date(project.shootStartDate)
    const endDate = new Date(project.shootEndDate)
    const options = { month: 'short', day: 'numeric', year: 'numeric' } as const

    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on the Apply button or its children
    if ((e.target as HTMLElement).closest('button')) {
      return
    }
    router.push(`/projects/${slugifyName(project.projectName)}`)
  }

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!session?.user?.id) {
      return
    }

    setIsWishlistLoading(true)
    try {
      if (isWishlisted) {
        const response = await fetch(`/api/wishlist?projectId=${project.id}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          setIsWishlisted(false)
        }
      } else {
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ projectId: project.id }),
        })
        if (response.ok) {
          setIsWishlisted(true)
        }
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error)
    } finally {
      setIsWishlistLoading(false)
    }
  }

  return (
    <>
      <div
        className="group relative rounded-2xl overflow-hidden transform transition-all duration-500 hover:scale-[1.02] cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.08) 50%, rgba(236, 72, 153, 0.05) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid #0212b3',
          boxShadow: '0 8px 32px rgba(99, 102, 241, 0.15), 0 4px 16px rgba(168, 85, 247, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
        }}
        onClick={handleCardClick}
      >
        {/* Animated colorful background gradient */}
        <div className="absolute inset-0 opacity-80">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/60 via-purple-100/50 to-pink-100/60"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-blue-50/40 via-transparent to-violet-50/40"></div>
        </div>
        
        {/* Crystal shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        {/* Floating orbs for depth */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-tr from-pink-400/20 to-purple-400/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
        
        {/* Card header */}
        <div className="relative p-4 z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent line-clamp-1 group-hover:from-indigo-600 group-hover:via-purple-600 group-hover:to-pink-600 transition-all duration-300">
                {project.projectName}
              </h3>
              <div className="flex items-center mt-2">
                <Badge 
                  variant="secondary" 
                  className="text-xs font-semibold px-2.5 py-1 rounded-full shadow-md"
                  style={{
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.25) 100%)',
                    color: '#4f46e5',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                  }}
                >
                  {project.projectType}
                </Badge>
              </div>
            </div>
            {/* Wishlist button for crew */}
            {(session?.user?.role === 'CREW') && (
              <button
                onClick={toggleWishlist}
                disabled={isWishlistLoading}
                className="p-2.5 rounded-xl backdrop-blur-md transition-all duration-300 disabled:opacity-50 shadow-lg hover:scale-110"
                style={{
                  background: isWishlisted 
                    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.25) 100%)'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.5) 100%)',
                  border: isWishlisted 
                    ? '1px solid rgba(239, 68, 68, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.6)',
                  boxShadow: isWishlisted
                    ? '0 4px 12px rgba(239, 68, 68, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
                    : '0 4px 12px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
                }}
              >
                <Heart 
                  className={`h-5 w-5 transition-all duration-300 ${
                    isWishlisted 
                      ? 'fill-red-500 text-red-500' 
                      : 'text-gray-600 hover:text-red-500'
                  }`}
                />
              </button>
            )}
          </div>

          {/* Location and Dates */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-3 text-sm">
            <div className="flex items-center text-gray-800 dark:text-gray-200 min-w-0 px-2.5 py-1.5 rounded-lg backdrop-blur-md border shadow-sm" style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.5) 100%)',
              borderColor: 'rgba(99, 102, 241, 0.2)',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
            }}>
              <MapPin className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 text-indigo-600" />
              <span className="truncate font-semibold text-xs">{project.location}</span>
            </div>
            <div className="flex items-center text-gray-800 dark:text-gray-200 min-w-0 px-2.5 py-1.5 rounded-lg backdrop-blur-md border shadow-sm" style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.5) 100%)',
              borderColor: 'rgba(168, 85, 247, 0.2)',
              boxShadow: '0 2px 8px rgba(168, 85, 247, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
            }}>
              <Calendar className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 text-purple-600" />
              <span className="truncate font-semibold text-xs">{formatDateRange()}</span>
            </div>
          </div>
        </div>

        {/* Project details section */}
        <div className="relative px-4 py-3 space-y-3 z-10">
          {/* Glass divider */}
          <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-indigo-300/60 to-transparent shadow-sm"></div>
          
          {/* Description - Short Preview */}
          <div>
            <p className="text-gray-700 dark:text-gray-200 text-sm line-clamp-2 leading-relaxed">
              {project.description}
            </p>
          </div>

          {/* Roles Needed */}
          <div className="flex items-start">
            <div className="p-1.5 rounded-lg shadow-md" style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.25) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
            }}>
              <Film className="w-3.5 h-3.5 text-indigo-700 flex-shrink-0" />
            </div>
            <div className="flex flex-wrap gap-1.5 ml-2 min-w-0">
              {project.rolesNeeded.slice(0, 3).map((roleItem: string | { role: string, count?: number }) => (
                <Badge
                  key={typeof roleItem === 'string' ? roleItem : JSON.stringify(roleItem)}
                  variant="secondary"
                  className="text-xs px-2.5 py-1 rounded-full font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(249, 250, 251, 0.95) 100%)',
                    color: '#1f2937',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
                  }}
                >
                  {typeof roleItem === 'string' ? roleItem : roleItem.role}
                </Badge>
              ))}
              {project.rolesNeeded.length > 3 && (
                <Badge
                  variant="secondary"
                  className="text-xs px-2.5 py-1 rounded-full font-semibold shadow-md"
                  style={{
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(236, 72, 153, 0.2) 100%)',
                    color: '#7c3aed',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    boxShadow: '0 2px 8px rgba(168, 85, 247, 0.15)'
                  }}
                >
                  +{project.rolesNeeded.length - 3}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Contact and actions section */}
        <div className="relative px-4 py-3 flex-shrink-0 z-10" style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(249, 250, 251, 0.85) 50%, rgba(243, 244, 246, 0.9) 100%)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(99, 102, 241, 0.15)'
        }}>
          {/* Glass divider */}
          <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-indigo-300/70 via-purple-300/70 to-transparent shadow-sm"></div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center text-xs text-gray-800 dark:text-gray-200 gap-2 min-w-0 flex-1">
              <div className="flex items-center min-w-0">
                <Avatar className="h-8 w-8 mr-2 sm:h-9 sm:w-9 md:h-10 md:w-10">
                  {employerImgVisible && project.employer.user.image ? (
                    <AvatarImage src={project.employer.user.image} alt={project.employer.user.name} onError={() => setEmployerImgVisible(false)} />
                  ) : null}
                  <AvatarFallback>{project.employer.user.name?.slice(0,1).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <span className="truncate font-bold bg-gradient-to-r from-indigo-800 via-purple-800 to-pink-800 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">Posted by {project.employer.user.name}</span>
              </div>
              {project._count.applications > 0 && (
                <span className="flex items-center px-2 py-1 rounded-full backdrop-blur-md border shadow-sm" style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.6) 100%)',
                  borderColor: 'rgba(168, 85, 247, 0.2)',
                  boxShadow: '0 2px 6px rgba(168, 85, 247, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
                }}>
                  <Users className="w-3 h-3 mr-1 flex-shrink-0 text-purple-700" />
                  <span className="font-bold text-gray-900 dark:text-gray-100">{project._count.applications} applicant{project._count.applications !== 1 ? 's' : ''}</span>
                </span>
              )}
            </div>

            {(session?.user?.role === 'CREW' || !session) && (
              <div className="w-full sm:w-auto">
                {hasApplied ? (
                  <Button
                    variant="outline"
                    disabled
                    size="sm"
                    className="w-full sm:w-auto font-bold rounded-xl transition-all duration-300 shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.25) 100%)',
                      color: '#047857',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      boxShadow: '0 6px 16px rgba(16, 185, 129, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.7)'
                    }}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Applied
                  </Button>
                ) : (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleApply()
                    }}
                    variant="default"
                    size="sm"
                    disabled={isApplying}
                    className="w-full sm:w-auto font-bold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isApplying ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      'Apply Now'
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showApplyModal && (
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
            questions: project.questions
          }}
          onClose={() => setShowApplyModal(false)}
          onSuccess={onApply || (() => {})}
        />
      )}
    </>
  )
}
