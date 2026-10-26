'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/lib/auth/session-context'
import { useRouter } from 'next/navigation'
import { slugifyName } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ApplyModal } from '@/components/applications/ApplyModal'
import { CheckCircle, MapPin, Calendar, Film, Users, User, Check, ExternalLink, Heart, Clock } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useProjectStatus } from '@/lib/crew/applied-projects'
import { formatBudget, formatShootRange } from '@/lib/projects/format'
import { displayHashtags } from '@/lib/projectTags'

interface Project {
  id: string
  projectName: string
  projectType: string
  rolesNeeded: Array<string | { role: string, count?: number }>
  shootStartDate: string | null
  shootEndDate: string | null
  budgetMin?: number | null
  budgetMax?: number | null
  budgetFixed?: boolean | null
  productionHouse?: string | null
  tags?: string[]
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
  createdAt?: string
}

interface ProjectCardProps {
  project: Project
  onApply?: () => void
  initialHasApplied?: boolean
  initialIsWishlisted?: boolean
}

export function ProjectCard({
  project,
  onApply,
  initialHasApplied,
  initialIsWishlisted,
}: ProjectCardProps) {
  const [employerImgVisible, setEmployerImgVisible] = useState(!!project.employer.user.image)

  const { data: session } = useSession()
  const router = useRouter()
  const [showApplyModal, setShowApplyModal] = useState(false)
  const { hasApplied, isWishlisted, setHasApplied, setIsWishlisted } = useProjectStatus(
    project.id,
    initialHasApplied,
    initialIsWishlisted
  )
  const [isWishlistLoading, setIsWishlistLoading] = useState(false)
  const [isApplying, setIsApplying] = useState(false)

  const handleApply = async () => {
    if (isApplying) return;
    setIsApplying(true);
    if (!session) {
      // Redirect guests to sign in as crew before applying, preserving current page
      const returnUrl = typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/find-work'
      router.push(`/accounts?tab=signin&role=crew&returnUrl=${encodeURIComponent(returnUrl)}`)
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

          // Trials only matter once an admin has turned paid plans on (everything is free until then)
          const plans = await fetch('/api/settings/public').then((r) => (r.ok ? r.json() : { paidPlansEnabled: false })).catch(() => ({ paidPlansEnabled: false }))

          // If free trial, check if trial has expired
          if (plans.paidPlansEnabled === true && subscriptionTier === 'FREE_TRIAL' && userData.crewProfile?.trialEnds) {
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

  const formatDateRange = () => formatShootRange(project.shootStartDate, project.shootEndDate)

  const formatPostedDate = (dateString?: string) => {
    if (!dateString) return null
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return null
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      if (diffDays <= 0) return 'Posted today'
      if (diffDays === 1) return 'Posted 1d ago'
      if (diffDays < 7) return `Posted ${diffDays}d ago`
      return `Posted ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    } catch {
      return null
    }
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
        className="group relative rounded-2xl overflow-hidden transform transition-all duration-300 hover:scale-[1.01] hover:shadow-xl cursor-pointer flex flex-col justify-between h-full"
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
        <div className="absolute inset-0 opacity-80 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/60 via-purple-100/50 to-pink-100/60"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-blue-50/40 via-transparent to-violet-50/40"></div>
        </div>
        
        {/* Crystal shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        
        {/* Floating orbs for depth */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700 pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-tr from-pink-400/20 to-purple-400/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700 pointer-events-none"></div>
        
        {/* Card Main Body */}
        <div className="relative p-4 sm:p-5 z-10 flex-1 flex flex-col justify-between">
          <div>
            {/* Header: Title + Wishlist */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* Full Title (never cut off) */}
                <h3 className="text-base sm:text-lg font-bold bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent group-hover:from-indigo-600 group-hover:via-purple-600 group-hover:to-pink-600 transition-all duration-300 leading-snug">
                  {project.projectName}
                </h3>

                {/* Hashtags */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {displayHashtags(project.projectType, project.tags).map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-50/90 text-indigo-700 border border-indigo-200/80 shadow-2xs hover:bg-indigo-100 transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Wishlist button for crew */}
              {(session?.user?.role === 'CREW') && (
                <button
                  onClick={toggleWishlist}
                  disabled={isWishlistLoading}
                  className="p-2 rounded-xl backdrop-blur-md transition-all duration-300 disabled:opacity-50 shadow-md hover:scale-110 shrink-0"
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
                  aria-label="Wishlist project"
                >
                  <Heart 
                    className={`h-4 w-4 transition-all duration-300 ${
                      isWishlisted 
                        ? 'fill-red-500 text-red-500' 
                        : 'text-gray-600 hover:text-red-500'
                    }`}
                  />
                </button>
              )}
            </div>

            {/* Location, Deadline, Posted Date */}
            <div className="flex flex-wrap items-center gap-1.5 mt-3 text-xs">
              {project.location && (
                <div className="flex items-center text-gray-800 dark:text-gray-200 min-w-0 px-2.5 py-1 rounded-lg backdrop-blur-md border shadow-2xs" style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.5) 100%)',
                  borderColor: 'rgba(99, 102, 241, 0.2)',
                  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
                }}>
                  <MapPin className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 text-indigo-600" />
                  <span className="truncate max-w-[130px] font-semibold text-xs">{project.location}</span>
                </div>
              )}
              <div className="flex items-center text-gray-800 dark:text-gray-200 min-w-0 px-2.5 py-1 rounded-lg backdrop-blur-md border shadow-2xs" style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.5) 100%)',
                borderColor: 'rgba(168, 85, 247, 0.2)',
                boxShadow: '0 2px 8px rgba(168, 85, 247, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
              }}>
                <Calendar className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 text-purple-600" />
                <span className="truncate font-semibold text-xs">{formatDateRange()}</span>
              </div>
              {formatBudget(project) && (
                <div className="flex items-center text-emerald-800 min-w-0 px-2.5 py-1 rounded-lg border border-emerald-200 bg-emerald-50/80 shadow-2xs">
                  <span className="truncate font-semibold text-xs">{formatBudget(project)}</span>
                </div>
              )}
              {formatPostedDate(project.createdAt) && (
                <div className="flex items-center text-gray-700 dark:text-gray-300 min-w-0 px-2.5 py-1 rounded-lg backdrop-blur-md border shadow-2xs" style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.5) 100%)',
                  borderColor: 'rgba(156, 163, 175, 0.3)',
                  boxShadow: '0 2px 8px rgba(156, 163, 175, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
                }}>
                  <Clock className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 text-gray-500" />
                  <span className="truncate font-medium text-xs">{formatPostedDate(project.createdAt)}</span>
                </div>
              )}
            </div>

            {/* Description Preview */}
            <p className="mt-2.5 text-gray-700 dark:text-gray-200 text-sm line-clamp-2 leading-relaxed">
              {project.description}
            </p>
          </div>

          {/* Crew Profession Requirements (Roles Needed) */}
          <div className="mt-3 pt-2.5 border-t border-indigo-100/60">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Film className="w-3.5 h-3.5 text-indigo-700 flex-shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Roles Required:
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 min-w-0">
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

        {/* Contact and actions section (Footer) */}
        <div className="relative px-4 py-3 flex-shrink-0 z-10" style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(249, 250, 251, 0.85) 50%, rgba(243, 244, 246, 0.9) 100%)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(99, 102, 241, 0.15)'
        }}>
          {/* Glass divider */}
          <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-indigo-300/70 via-purple-300/70 to-transparent shadow-sm"></div>
          
          <div className="flex items-center justify-between gap-3">
            {/* Left side: Employer Avatar + Posted by name & applicants count */}
            <div className="flex items-center text-xs text-gray-800 dark:text-gray-200 gap-2 min-w-0 flex-1">
              <Avatar className="h-8 w-8 sm:h-9 sm:w-9 shrink-0">
                {employerImgVisible && project.employer.user.image ? (
                  <AvatarImage src={project.employer.user.image} alt={project.employer.user.name} onError={() => setEmployerImgVisible(false)} />
                ) : null}
                <AvatarFallback>{project.employer.user.name?.slice(0,1).toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex flex-col">
                <span className="truncate font-bold bg-gradient-to-r from-indigo-800 via-purple-800 to-pink-800 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  Posted by {project.employer.user.name}
                </span>
                {project._count.applications > 0 && (
                  <span className="text-[10px] text-gray-600 dark:text-gray-400 font-semibold flex items-center gap-1">
                    <Users className="w-2.5 h-2.5 text-purple-700 shrink-0" />
                    {project._count.applications} applicant{project._count.applications !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Right side: Apply Now at the one side */}
            {(session?.user?.role === 'CREW' || !session) && (
              <div className="shrink-0">
                {hasApplied ? (
                  <Button
                    variant="outline"
                    disabled
                    size="sm"
                    className="font-bold rounded-xl transition-all duration-300 shadow-lg px-3.5 py-1.5 h-8 text-xs cursor-default"
                    style={{
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.25) 100%)',
                      color: '#047857',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      boxShadow: '0 6px 16px rgba(16, 185, 129, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.7)'
                    }}
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
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
                    className="font-bold rounded-xl px-4 py-1.5 h-8 text-xs transition-all duration-300 hover:scale-105 hover:shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isApplying ? (
                      <span className="flex items-center gap-1.5">
                        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
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
          onClose={() => {
            setShowApplyModal(false)
            setIsApplying(false)
          }}
          onSuccess={() => {
            setHasApplied(true)
            onApply?.()
          }}
        />
      )}
    </>
  )
}
