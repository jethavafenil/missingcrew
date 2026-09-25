'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ConnectionButton } from '@/components/network/ConnectionButton'
import { HireButton } from '@/components/network/HireButton'
import { SocialShare } from '@/components/ui/social-share'
import { useSession } from '@/lib/auth/session-context'
import { 
  Globe, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight,
  MapPin,
  Briefcase,
  DollarSign,
  Calendar,
  CheckCircle,
  Camera,
  Award,
  Star,
  MessageSquare
} from 'lucide-react'
import dynamic from 'next/dynamic'
const CrewNetworkSection = dynamic(() => import('@/components/network/CrewNetworkSection').then(m => m.CrewNetworkSection), { ssr: false })

interface CrewProfile {
  id: string
  user: {
    id: string
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
  budgetFlexible: boolean
  languages: string[]
  imdbLink: string | null
  portfolioLinks: string[]
  pastProjects: Array<{ title?: string; year?: number; role?: string; link?: string | null; notes?: string | null }>
  referredBy: string | null
  contactWhatsApp: string | null
  subscriptionTier: string
  createdAt: string
  skills?: string[]
  specializations?: string[]
  bio?: string
}

export default function CrewProfilePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [crew, setCrew] = useState<CrewProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const fromProject = searchParams.get('fromProject') === 'true'
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)

  const slugify = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')

  const fetchCrewProfile = useCallback(async (crewId: string) => {
    try {
      const response = await fetch(`/api/crew/${crewId}`)
      if (response.ok) {
        const data = await response.json()
        setCrew(data.crew)
        // If accessed by ID, replace URL with pretty slug based on name
        if (typeof window !== 'undefined' && data?.crew?.user?.name && typeof crewId === 'string') {
          const current = crewId as string
          const expectedSlug = slugify(data.crew.user.name)
          // If current param isn't the expected slug, update URL
          if (current !== expectedSlug) {
            router.replace(`/crew/${expectedSlug}`)
          }
        }
      } else {
        router.push('/browse-crew')
      }
    } catch (error) {
      console.error('Error fetching crew profile:', error)
      router.push('/browse-crew')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (params.id) {
      fetchCrewProfile(params.id as string)
    }
  }, [params.id, fetchCrewProfile])

  // Ensure the address bar shows the pretty slug when crew data is available
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!crew?.user?.name) return
    const expectedSlug = slugify(crew.user.name)
    const currentSegment = (params.id as string) || ''
    if (currentSegment !== expectedSlug) {
      const url = new URL(window.location.href)
      url.pathname = `/crew/${expectedSlug}`
      router.replace(url.toString())
    }
  }, [crew?.user?.name])


  // Helper functions for media
  const getVimeoId = (url: string): string | null => {
    const match = url.match(/vimeo\.com\/(\d+)/)
    return match ? match[1] : null
  }

  const getYouTubeId = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/)
    return match ? match[1] : null
  }

  const isImageUrl = (url: string): boolean => {
    // Check for common image file extensions
    if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)) {
      return true
    }
    // Check for common image hosting services without extensions
    if (/images\.unsplash\.com|unsplash\.com\/photos/i.test(url)) {
      return true
    }
    // Check for other image CDNs
    if (/media-amazon\.com\/images|cloudinary\.com\/image|imgix\.net|cloudflare\.com\/cdn-cgi\/image/i.test(url)) {
      return true
    }
    return false
  }

  const isImdbUrl = (url: string): boolean => {
    return /imdb\.com/i.test(url)
  }

  const getAllPortfolioMedia = () => {
    if (!crew) return null
    
    const mediaItems: Array<{ type: 'vimeo' | 'youtube' | 'image' | 'imdb', id?: string, url: string }> = []
    
    if (!crew.portfolioLinks || crew.portfolioLinks.length === 0) {
      // Show IMDb link card if available
      if (crew.imdbLink && typeof crew.imdbLink === 'string') {
        mediaItems.push({ type: 'imdb', url: crew.imdbLink })
      }
      return mediaItems.length > 0 ? mediaItems : null
    }
    
    for (const link of crew.portfolioLinks) {
      // Ensure link is a string
      if (typeof link !== 'string') continue
      
      const vimeoId = getVimeoId(link)
      if (vimeoId) {
        mediaItems.push({ type: 'vimeo', id: vimeoId, url: link })
        continue
      }
      
      const youtubeId = getYouTubeId(link)
      if (youtubeId) {
        mediaItems.push({ type: 'youtube', id: youtubeId, url: link })
        continue
      }
      
      if (isImageUrl(link)) {
        mediaItems.push({ type: 'image', url: link })
        continue
      }
      
      if (isImdbUrl(link)) {
        // Show IMDb link card for IMDb URLs
        mediaItems.push({ type: 'imdb', url: link })
        continue
      }
    }
    
    // Also add imdbLink if available and not already in portfolio
    if (crew.imdbLink && typeof crew.imdbLink === 'string' && !crew.portfolioLinks.some(link => link === crew.imdbLink)) {
      mediaItems.push({ type: 'imdb', url: crew.imdbLink })
    }
    
    return mediaItems.length > 0 ? mediaItems : null
  }

  const portfolioMediaItems = crew ? getAllPortfolioMedia() : null
  const hasMultipleMedia = portfolioMediaItems && portfolioMediaItems.length > 1

  const nextMedia = () => {
    if (portfolioMediaItems) {
      setCurrentMediaIndex((prev) => (prev + 1) % portfolioMediaItems.length)
    }
  }

  const prevMedia = () => {
    if (portfolioMediaItems) {
      setCurrentMediaIndex((prev) => (prev - 1 + portfolioMediaItems.length) % portfolioMediaItems.length)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!crew || !crew.user) {
    // A profile without its user row (orphaned profile — e.g. pre-backfill
    // data) cannot render: name, avatar and contacts all come from user.
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-xl p-12 max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Crew Member Not Found</h1>
          <p className="text-gray-600 mb-6">The profile you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Button 
            onClick={() => router.push('/browse-crew')}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            Back to Browse Crew
          </Button>
        </div>
      </div>
    )
  }

  const canViewContacts = !!(session?.user?.role === 'EMPLOYER' || session?.user?.id === crew.user.id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => {
            if (fromProject) {
              router.push('/employer/dashboard')
            } else {
              router.push('/browse-crew')
            }
          }}
          className="mb-6 hover:bg-indigo-50 hover:border-indigo-300 transition-all"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {fromProject ? 'Back to Projects' : 'Back to Crew'}
        </Button>

        {/* Portfolio Media Banner */}
        {portfolioMediaItems && portfolioMediaItems.length > 0 && (
          <div className="relative w-full h-48 sm:h-56 md:h-64 lg:h-80 overflow-hidden rounded-lg shadow-lg mb-4 sm:mb-6 bg-black group/carousel">
            {portfolioMediaItems[currentMediaIndex].type === 'vimeo' && (
              <div className="relative w-full h-full">
                <iframe
                  src={`https://player.vimeo.com/video/${portfolioMediaItems[currentMediaIndex].id}?title=0&byline=0&portrait=0`}
                  className="w-full h-full object-cover"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title="Portfolio video"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"></div>
              </div>
            )}
            {portfolioMediaItems[currentMediaIndex].type === 'youtube' && (
              <div className="relative w-full h-full">
                <iframe
                  src={`https://www.youtube.com/embed/${portfolioMediaItems[currentMediaIndex].id}`}
                  className="w-full h-full object-cover"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Portfolio video"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"></div>
              </div>
            )}
            {portfolioMediaItems[currentMediaIndex].type === 'image' && (
              <div className="relative w-full h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={portfolioMediaItems[currentMediaIndex].url}
                  alt="Portfolio preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
              </div>
            )}
            {portfolioMediaItems[currentMediaIndex].type === 'imdb' && (
              <div className="relative w-full h-full bg-gradient-to-br from-yellow-400/20 to-yellow-600/30 flex items-center justify-center">
                <a
                  href={portfolioMediaItems[currentMediaIndex].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center space-y-4 text-yellow-900 hover:text-yellow-700 transition-colors group"
                >
                  <Globe className="w-20 h-20" />
                  <span className="text-xl font-bold">View IMDb Profile</span>
                  <ExternalLink className="w-6 h-6" />
                </a>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
              </div>
            )}
            
            {/* Carousel Navigation */}
            {hasMultipleMedia && (
              <>
                <button
                  onClick={(e) => { e.preventDefault(); prevMedia(); }}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-white/90 hover:bg-white backdrop-blur-md transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 hover:scale-110 z-20 shadow-lg"
                  aria-label="Previous media"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6 text-indigo-700" />
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); nextMedia(); }}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-white/90 hover:bg-white backdrop-blur-md transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 hover:scale-110 z-20 shadow-lg"
                  aria-label="Next media"
                >
                  <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 text-indigo-700" />
                </button>
                
                {/* Carousel Indicators */}
                <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex space-x-1.5 sm:space-x-2 z-20">
                  {portfolioMediaItems.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => { e.preventDefault(); setCurrentMediaIndex(index); }}
                      className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                        index === currentMediaIndex ? 'w-6 sm:w-8 bg-white' : 'w-1.5 sm:w-2 bg-white/50 hover:bg-white/75'
                      }`}
                      style={{
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                      }}
                      aria-label={`Go to media ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-6">
          {/* Gradient Top Bar */}
          <div className="h-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"></div>
          
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start space-y-6 md:space-y-0 md:space-x-8">
              {/* Photo */}
              <div className="flex-shrink-0 mx-auto md:mx-0">
                <div className="relative">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center overflow-hidden border-4 border-white shadow-xl">
                    {crew.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={crew.photo}
                        alt={crew.user.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement
                          if (fallback) fallback.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <span 
                      className="text-indigo-600 text-5xl sm:text-6xl font-bold w-full h-full flex items-center justify-center"
                      style={{ display: crew.photo ? 'none' : 'flex' }}
                    >
                      {crew.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {/* Status Badge */}
                  <div className="absolute -bottom-2 -right-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg ${
                      crew.availability
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                        : 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                    }`}>
                      {crew.availability ? '● Available' : '● Booked'}
                    </div>
                  </div>
                </div>
              </div>

            {/* Basic Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent mb-2">
                    {crew.user.name}
                  </h1>
                  <p className="text-xl sm:text-2xl font-semibold text-indigo-600 mt-2">
                    {crew.primaryRoles.join(' • ')}
                  </p>

                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4 text-gray-600">
                    <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                      <MapPin className="h-4 w-4 text-indigo-600" />
                      <span className="text-sm font-medium">{crew.location || crew.city || 'Location not specified'}</span>
                    </span>
                    <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                      <Briefcase className="h-4 w-4 text-indigo-600" />
                      <span className="text-sm font-medium">{crew.yearsExperience || 'Experience not specified'}</span>
                    </span>
                    {crew.dailyBudgetMin && crew.dailyBudgetMax && (
                      <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                        <DollarSign className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm font-medium">
                          ₹{crew.dailyBudgetMin} - ₹{crew.dailyBudgetMax}/day
                          {crew.budgetFlexible && <span className="ml-1 text-green-600">(Flexible)</span>}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Verification Badges */}
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4 md:mt-0">
                  {crew.user.phoneVerified && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md">
                      <CheckCircle className="h-4 w-4" />
                      Phone Verified
                    </span>
                  )}
                  {crew.portfolioLinks && crew.portfolioLinks.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md">
                      <Camera className="h-4 w-4" />
                      Portfolio
                    </span>
                  )}
                  {crew.subscriptionTier === 'PRO' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md">
                      <Award className="h-4 w-4" />
                      PRO Member
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons: Connect + Hire + Share */}
              <div className="mt-6 flex flex-wrap items-center gap-3 justify-center md:justify-start">
                {/* Connect shows only if logged in */}
                {session?.user?.id && (
                  <ConnectionButton
                    userId={crew.user.id}
                    currentUserId={session.user.id}
                    onSuccess={() => {
                      console.log('Connection request sent successfully')
                    }}
                  />
                )}
                {/* Hire shows for everyone (HireButton handles routing for non-employers/non-logged-in) */}
                <HireButton crewUserId={crew.user.id} primaryRole={crew.primaryRoles?.[0]} />
                {/* Social Share button */}
                <SocialShare 
                  url={typeof window !== 'undefined' ? window.location.href : `https://missingcrew.vercel.app/crew/${params.id}`}
                  title={`Check out ${crew.user.name}'s profile on MissingCrew`}
                  description={`${crew.primaryRoles.join(', ')} - ${crew.yearsExperience || 'Experienced'} professional`}
                />
              </div>
              {/* Availability Status */}
              <div className="mt-6 p-5 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl border border-indigo-100">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-indigo-600" />
                      Availability
                    </h3>
                    <p className="text-gray-700 mt-2 font-medium">
                      {crew.availability
                        ? (crew.availabilityStart && crew.availabilityEnd
                            ? `${new Date(crew.availabilityStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${new Date(crew.availabilityEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                            : 'Available Immediately'
                          )
                        : 'Currently Booked'}
                    </p>
                  </div>
                </div>
                {crew.availableToTravel && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 mt-3 font-medium">
                    <CheckCircle className="h-4 w-4" />
                    Available to travel for projects
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
        {/* Tab Navigation */}
        <div className="bg-white rounded-t-2xl shadow-lg border border-b-0 border-gray-200 overflow-hidden">
          <nav className="flex space-x-1 p-2">
            {[
              { id: 'overview', label: 'Overview', icon: Star },
              { id: 'portfolio', label: 'Portfolio', icon: Camera },
              { id: 'experience', label: 'Experience', icon: Briefcase },
              { id: 'contact', label: 'Contact', icon: MessageSquare }
            ].map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-medium text-sm rounded-xl transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.substring(0, 3)}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-b-2xl shadow-lg border border-t-0 border-gray-200 p-6 md:p-8">
          {activeTab === 'overview' && <OverviewTab crew={crew} />}
          {activeTab === 'portfolio' && <PortfolioTab crew={crew} />}
          {activeTab === 'experience' && <ExperienceTab crew={crew} />}
          {activeTab === 'contact' && <ContactTab crew={crew} canViewContacts={canViewContacts} />}
        </div>
                      {/* Network Profiles Section - moved inside header card bottom */}
              <div className="mt-6">
                <CrewNetworkSection crewUserId={crew.user.id} />
              </div>
      </div>
    </div>
  )
}

function OverviewTab({ crew }: { crew: CrewProfile }) {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Professional Details */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Details</h3>
        <div className="space-y-4">
          <div>
            <span className="font-medium text-gray-700">Primary Roles:</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {crew.primaryRoles.map(role => (
                <span
                  key={role}
                  className="inline-block bg-indigo-100 text-indigo-800 rounded-full px-3 py-1 text-sm font-medium"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="font-medium text-gray-700">Years of Experience:</span>
            <p className="mt-1 text-gray-600">{crew.yearsExperience || 'Not specified'}</p>
          </div>

          <div>
            <span className="font-medium text-gray-700">Project Types:</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {crew.projectTypes.map(type => (
                <span
                  key={type}
                  className="inline-block bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="font-medium text-gray-700">Languages:</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {crew.languages.map(language => (
                <span
                  key={language}
                  className="inline-block bg-gray-100 text-gray-700 rounded-full px-3 py-1 text-sm"
                >
                  {language}
                </span>
              ))}
            </div>
          </div>

          {/* Skills */}
          {crew.skills && crew.skills.length > 0 && (
            <div>
              <span className="font-medium text-gray-700">Skills:</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {crew.skills.map(skill => (
                  <span
                    key={skill}
                    className="inline-block bg-green-100 text-green-800 rounded-full px-3 py-1 text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Specializations */}
          {crew.specializations && crew.specializations.length > 0 && (
            <div>
              <span className="font-medium text-gray-700">Specializations:</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {crew.specializations.map(specialization => (
                  <span
                    key={specialization}
                    className="inline-block bg-purple-100 text-purple-800 rounded-full px-3 py-1 text-sm"
                  >
                    {specialization}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Bio */}
      {crew.bio && (
        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bio</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 whitespace-pre-line">{crew.bio}</p>
          </div>
        </div>
      )}

      {/* Budget & Availability */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget & Availability</h3>
        <div className="space-y-4">
          <div>
            <span className="font-medium text-gray-700">Daily Budget Range:</span>
            <p className="mt-1 text-gray-600">
              {crew.dailyBudgetMin && crew.dailyBudgetMax
                ? `₹${crew.dailyBudgetMin} - ₹${crew.dailyBudgetMax}`
                : 'Not specified'}
              {crew.budgetFlexible && ' (Flexible)'}
            </p>
          </div>

          <div>
            <span className="font-medium text-gray-700">Availability:</span>
            <p className="mt-1 text-gray-600">
              {crew.availability
                ? (crew.availabilityStart && crew.availabilityEnd
                    ? `${new Date(crew.availabilityStart).toLocaleDateString()} - ${new Date(crew.availabilityEnd).toLocaleDateString()}`
                    : 'Immediately available'
                  )
                : 'Currently booked'}
            </p>
          </div>

          <div>
            <span className="font-medium text-gray-700">Travel Availability:</span>
            <p className="mt-1 text-gray-600">
              {crew.availableToTravel ? 'Available to travel' : 'Prefers local projects'}
            </p>
          </div>

          {crew.referredBy && (
            <div>
              <span className="font-medium text-gray-700">Referred By:</span>
              <p className="mt-1 text-gray-600">{crew.referredBy}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PortfolioTab({ crew }: { crew: CrewProfile }) {
  // Define a type for portfolio items
  interface PortfolioItem {
    url: string
    title: string
  }

  // Handle different data structures for portfolioLinks
  let portfolioItems: PortfolioItem[] = []

  if (crew.portfolioLinks) {
    if (Array.isArray(crew.portfolioLinks)) {
      // If it's already an array, use it directly
      portfolioItems = crew.portfolioLinks.map(item => {
        // Handle both object and string cases
        if (typeof item === 'object' && item !== null) {
          // Type assertion to handle the object case
          const portfolioItem = item as { url?: string, title?: string }
          return {
            url: portfolioItem.url || '',
            title: portfolioItem.title || portfolioItem.url || 'Untitled Portfolio'
          }
        } else if (typeof item === 'string') {
          return {
            url: item,
            title: item
          }
        }
        return {
          url: '',
          title: 'Untitled Portfolio'
        }
      })
    } else if (typeof crew.portfolioLinks === 'string') {
      // If it's a string, try to parse it as JSON
      try {
        const parsed = JSON.parse(crew.portfolioLinks)
        if (Array.isArray(parsed)) {
          portfolioItems = parsed.map(item => {
            const portfolioItem = item as { url?: string, title?: string }
            return {
              url: portfolioItem.url || '',
              title: portfolioItem.title || portfolioItem.url || 'Untitled Portfolio'
            }
          })
        }
      } catch (e) {
        console.error("Error parsing portfolioLinks:", e)
      }
    }
  }

  if (!portfolioItems || portfolioItems.length === 0) {
    return (
        <div className="text-center py-8">
        <div className="text-gray-400 text-6xl mb-4">📷</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Portfolio Links</h3>
        <p className="text-gray-600">This crew member hasn&apos;t added any portfolio links yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio & Links</h3>

      {/* Portfolio Links */}
      <div>
        <h4 className="font-medium text-gray-700 mb-3">Portfolio Links:</h4>
        <div className="grid gap-3">
          {portfolioItems.map((item, index) => (
            <a
              key={index}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              <span className="text-indigo-600 mr-3">🔗</span>
              <span className="text-gray-700 truncate">{item.title}</span>
            </a>
          ))}
        </div>
      </div>

      {/* IMDb Link */}
      {crew.imdbLink && (
        <div>
          <h4 className="font-medium text-gray-700 mb-3">IMDb Profile:</h4>
          <a
            href={crew.imdbLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center p-3 border border-gray-200 rounded-lg hover:border-yellow-300 hover:bg-yellow-50 transition-colors"
          >
            <span className="text-yellow-600 mr-3">🎬</span>
            <span className="text-gray-700">View IMDb Profile</span>
          </a>
        </div>
      )}
    </div>
  )
}

function ExperienceTab({ crew }: { crew: CrewProfile }) {
  // Define a type for past projects
  interface PastProject {
    title: string
    role: string
    year: string
    link?: string
  }

  // Handle different data structures for pastProjects
  let pastProjects: PastProject[] = []

  if (crew.pastProjects) {
    if (Array.isArray(crew.pastProjects)) {
      // If it's already an array, use it directly
      pastProjects = crew.pastProjects.map(project => {
        // Handle both object and string cases
        if (typeof project === 'object' && project !== null) {
          // Type assertion to handle the object case
          const proj = project as { title?: string; role?: string; year?: string; url?: string; link?: string }
          return {
            title: proj.title || proj.url || 'Untitled Project',
            role: proj.role || 'Unknown role',
            year: proj.year || 'Unknown year',
            link: proj.link || proj.url
          }
        } else if (typeof project === 'string') {
          return {
            title: project,
            role: 'Unknown role',
            year: 'Unknown year'
          }
        }
        return {
          title: 'Untitled Project',
          role: 'Unknown role',
          year: 'Unknown year'
        }
      })
    } else if (typeof crew.pastProjects === 'string') {
      // If it's a string, try to parse it as JSON
      try {
        const parsed = JSON.parse(crew.pastProjects)
        if (Array.isArray(parsed)) {
          pastProjects = parsed.map(project => {
            const proj = project as { title?: string; role?: string; year?: string; url?: string; link?: string }
            return {
              title: proj.title || proj.url || 'Untitled Project',
              role: proj.role || 'Unknown role',
              year: proj.year || 'Unknown year',
              link: proj.link || proj.url
            }
          })
        }
      } catch (e) {
        console.error("Error parsing pastProjects:", e)
      }
    } else if (typeof crew.pastProjects === 'object') {
      // If it's an object, convert it to an array
      pastProjects = Object.entries(crew.pastProjects).map(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          const proj = value as { title?: string; role?: string; year?: string; url?: string; link?: string }
          return {
            title: proj.title || proj.url || key,
            role: proj.role || 'Unknown role',
            year: proj.year || 'Unknown year',
            link: proj.link || proj.url
          }
        }
        return {
          title: key,
          role: 'Unknown role',
          year: 'Unknown year'
        }
      })
    }
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Experience & Past Projects</h3>

      {/* Past Projects */}
      <div>
        <h4 className="font-medium text-gray-700 mb-4">Past Projects:</h4>
        {pastProjects.length === 0 ? (
          <p className="text-gray-600">No past projects listed.</p>
        ) : (
          <div className="space-y-4">
            {pastProjects.map((project, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">
                      {project.title}
                    </h5>
                    <p className="text-gray-600 text-sm mt-1">
                      {project.role}
                    </p>
                    {project.link && (
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 mt-2"
                      >
                        View Project
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                  <span className="text-gray-500 text-sm">
                    {project.year}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ContactTab({ crew, canViewContacts }: { crew: CrewProfile; canViewContacts: boolean }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>

      {!canViewContacts && (
        <div className="mb-4 p-4 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-800 flex items-center justify-between gap-3">
          <span>Only logged-in employers can view contact details. Please sign in as an employer to reveal this information.</span>
          <a
            href="/accounts?tab=signin&role=employer"
            className="inline-flex items-center px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          >
            Sign in
          </a>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Phone */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Phone</h4>
          <div className="flex items-center justify-between">
            <span className={`text-gray-600 ${!canViewContacts ? 'blur-sm select-none' : ''}`}>{crew.user.phone || 'Not provided'}</span>
            {crew.user.phone && canViewContacts && (
              <a
                href={`tel:${crew.user.phone}`}
                className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Call
              </a>
            )}
          </div>
          {crew.user.phoneVerified && (
            <span className="inline-flex items-center mt-2 text-xs text-green-600">
              ✓ Verified
            </span>
          )}
        </div>

        {/* WhatsApp */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">WhatsApp</h4>
          <div className="flex items-center justify-between">
            <span className={`text-gray-600 ${!canViewContacts ? 'blur-sm select-none' : ''}`}>
              {crew.contactWhatsApp || 'Not provided'}
            </span>
            {crew.contactWhatsApp && canViewContacts && (
              <a
                href={`https://wa.me/${crew.contactWhatsApp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Message
              </a>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Email</h4>
          <div className="flex items-center justify-between">
            <span className={`text-gray-600 ${!canViewContacts ? 'blur-sm select-none' : ''}`}>{crew.user.email}</span>
            {canViewContacts && (
              <a
                href={`mailto:${crew.user.email}`}
                className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Email
              </a>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Location</h4>
          <p className="text-gray-600">
            {crew.location || crew.city || 'Not specified'}
          </p>
          {crew.availableToTravel && (
            <span className="inline-flex items-center mt-2 text-xs text-blue-600">
              ✓ Available to travel
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
