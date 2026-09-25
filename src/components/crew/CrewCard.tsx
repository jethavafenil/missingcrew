'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/lib/auth/session-context'
import Link from 'next/link'
import { Button } from '../ui/button'
import { slugifyName } from '@/lib/utils'
import { Badge } from '../ui/badge'
import { Globe, Mail, Phone, MapPin, Calendar, IndianRupee, Languages, Film, Plane, Check, Star, ExternalLink, Heart, ChevronLeft, ChevronRight } from 'lucide-react'

interface PastProject {
  title?: string
  year?: number
  role?: string
  link?: string | null
  notes?: string | null
}

interface CrewCardProps {
  crew: {
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
    pastProjects: PastProject[]
    contactWhatsApp: string | null
    subscriptionTier: string
    createdAt: string
  }
}

export function CrewCard({ crew }: CrewCardProps) {
  const { data: session } = useSession()
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isWishlistLoading, setIsWishlistLoading] = useState(false)
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)

  useEffect(() => {
    if (session?.user?.id && session?.user?.role === 'EMPLOYER') {
      checkWishlistStatus()
    }
  }, [session, crew.id])

  const checkWishlistStatus = async () => {
    try {
      const response = await fetch(`/api/wishlist/check?crewId=${crew.id}`)
      if (response.ok) {
        const data = await response.json()
        setIsWishlisted(data.isWishlisted)
      }
    } catch (error) {
      console.error('Error checking wishlist status:', error)
    }
  }

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!session?.user?.id) {
      console.log('[CrewCard] No session, cannot toggle wishlist')
      return
    }

    console.log('[CrewCard] Toggling wishlist for crew:', crew.id, 'isWishlisted:', isWishlisted)
    setIsWishlistLoading(true)
    try {
      if (isWishlisted) {
        console.log('[CrewCard] Removing from wishlist...')
        const response = await fetch(`/api/wishlist?crewId=${crew.id}`, {
          method: 'DELETE',
        })
        console.log('[CrewCard] DELETE response status:', response.status)
        if (response.ok) {
          setIsWishlisted(false)
          console.log('[CrewCard] Successfully removed from wishlist')
        } else {
          const error = await response.json()
          console.error('[CrewCard] Failed to remove:', error)
        }
      } else {
        console.log('[CrewCard] Adding to wishlist...')
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ crewId: crew.id }),
        })
        console.log('[CrewCard] POST response status:', response.status)
        const data = await response.json()
        console.log('[CrewCard] POST response data:', data)
        if (response.ok) {
          setIsWishlisted(true)
          console.log('[CrewCard] Successfully added to wishlist')
        } else {
          console.error('[CrewCard] Failed to add:', data)
        }
      }
    } catch (error) {
      console.error('[CrewCard] Error toggling wishlist:', error)
    } finally {
      setIsWishlistLoading(false)
    }
  }

  const getAvailabilityText = () => {
    if (!crew.availability) {
      return 'Currently Booked'
    }
    if (crew.availabilityStart && crew.availabilityEnd) {
      const startDate = new Date(crew.availabilityStart)
      const endDate = new Date(crew.availabilityEnd)
      const options = { month: 'short', day: 'numeric', year: 'numeric' } as const
      return `Available from ${startDate.toLocaleDateString('en-US', options)} to ${endDate.toLocaleDateString('en-US', options)}`
    }
    return 'Available Immediately'
  }

  const getBudgetRange = () => {
    if (crew.dailyBudgetMin && crew.dailyBudgetMax) {
      return `₹${crew.dailyBudgetMin.toLocaleString()} - ₹${crew.dailyBudgetMax.toLocaleString()}/day`
    } else if (crew.dailyBudgetMin) {
      return `From ₹${crew.dailyBudgetMin.toLocaleString()}/day`
    } else if (crew.dailyBudgetMax) {
      return `Up to ₹${crew.dailyBudgetMax.toLocaleString()}/day`
    }
    return 'Budget not specified'
  }

  const getExperienceText = () => {
    if (!crew.yearsExperience) return 'Experience not specified'
    return crew.yearsExperience
  }

  const formatLocation = () => {
    if (crew.location) return crew.location
    if (crew.city) return crew.city
    return 'Location not specified'
  }

  // Extract video ID from Vimeo URL
  const getVimeoId = (url: string): string | null => {
    const match = url.match(/vimeo\.com\/(\d+)/)
    return match ? match[1] : null
  }

  // Extract video ID from YouTube URL
  const getYouTubeId = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/)
    return match ? match[1] : null
  }

  // Check if URL is an image
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

  // Check if URL is IMDb link
  const isImdbUrl = (url: string): boolean => {
    return /imdb\.com/i.test(url)
  }

  // Get all portfolio media items to display
  const getAllPortfolioMedia = () => {
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

  const portfolioMediaItems = getAllPortfolioMedia()
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

  return (
    <div className="group relative rounded-2xl shadow-lg overflow-hidden transform transition-all duration-500 hover:scale-[1.02] flex flex-col min-h-[340px]"
      style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.08) 50%, rgba(236, 72, 153, 0.05) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid #0212b3',
        boxShadow: '0 8px 32px rgba(99, 102, 241, 0.15), 0 4px 16px rgba(168, 85, 247, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
      }}
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
      
      {/* Portfolio Media Section */}
      {portfolioMediaItems && portfolioMediaItems.length > 0 && (
        <div className="relative w-full h-32 overflow-hidden z-10 bg-black/5 group/carousel">
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
                className="flex flex-col items-center justify-center space-y-2 text-yellow-900 hover:text-yellow-700 transition-colors group"
              >
                <Globe className="w-12 h-12" />
                <span className="text-sm font-bold">View IMDb Profile</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
            </div>
          )}
          
          {/* Carousel Navigation */}
          {hasMultipleMedia && (
            <>
              <button
                onClick={(e) => { e.preventDefault(); prevMedia(); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full backdrop-blur-md transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 hover:scale-110 z-20"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}
                aria-label="Previous media"
              >
                <ChevronLeft className="w-4 h-4 text-indigo-700" />
              </button>
              <button
                onClick={(e) => { e.preventDefault(); nextMedia(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full backdrop-blur-md transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 hover:scale-110 z-20"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}
                aria-label="Next media"
              >
                <ChevronRight className="w-4 h-4 text-indigo-700" />
              </button>
              
              {/* Carousel Indicators */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1.5 z-20">
                {portfolioMediaItems.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => { e.preventDefault(); setCurrentMediaIndex(index); }}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      index === currentMediaIndex ? 'w-6 bg-white' : 'bg-white/50 hover:bg-white/75'
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
      
      {/* Card header */}
      <div className="relative p-3 z-10">
        <div className="flex items-center space-x-4">
          {/* Wishlist button */}
          {session?.user?.role === 'EMPLOYER' && (
            <button
              onClick={toggleWishlist}
              disabled={isWishlistLoading}
              className="absolute top-3 right-3 z-20 p-2.5 rounded-xl backdrop-blur-md transition-all duration-300 disabled:opacity-50 shadow-lg hover:scale-110"
              style={{
                background: isWishlisted 
                  ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.25) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.5) 100%)',
                border: isWishlisted 
                  ? '1px solid rgba(239, 68, 68, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.6)',
                boxShadow: isWishlisted
                  ? '0 4px 12px rgba(239, 68, 68, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
                  : '0 4px 12px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
              }}
              title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart
                className={`w-5 h-5 transition-all duration-200 ${
                  isWishlisted
                    ? 'fill-red-500 text-red-500'
                    : 'text-gray-700 hover:text-red-400'
                }`}
              />
            </button>
          )}
          {/* Professional avatar with fallback */}
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-full overflow-hidden shadow-xl border-2 border-white">
              {crew.photo ? (
                <img
                  src={crew.photo}
                  alt={`${crew.user.name}'s profile`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                  {crew.user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {crew.subscriptionTier === 'PRO' && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-lg" style={{
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                boxShadow: '0 4px 12px rgba(251, 191, 36, 0.5)'
              }}>
                <Star className="w-3 h-3 text-white" fill="currentColor" />
              </div>
            )}
          </div>

          {/* Professional info section */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline space-x-2">
              <h3 className="text-base font-bold bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent truncate group-hover:from-indigo-600 group-hover:via-purple-600 group-hover:to-pink-600 transition-all duration-300">
                {crew.user.name}
              </h3>
              {crew.user.phoneVerified && (
                <div className="p-1 rounded-full" style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.25) 100%)',
                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
                }}>
                  <Check className="w-3.5 h-3.5 text-green-700" />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-1 mt-1.5">
              <Badge 
                variant="secondary" 
                className="text-xs font-semibold px-2.5 py-1 rounded-full shadow-md"
                style={{
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.25) 100%)',
                  color: '#4f46e5',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  boxShadow: '0 4px 10px rgba(99, 102, 241, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.7)'
                }}
              >
                {crew.primaryRoles[0] || 'Professional'}
              </Badge>
              {crew.primaryRoles.length > 1 && (
                <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">
                  +{crew.primaryRoles.length - 1} more
                </span>
              )}
            </div>

            {/* Professional tags */}
            <div className="flex items-center space-x-2 mt-1.5">
              {crew.availableToTravel && (
                <div className="flex items-center text-xs font-semibold px-2 py-1 rounded-full" style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.2) 100%)',
                  color: '#047857',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.2)'
                }}>
                  <Plane className="w-3 h-3 mr-1" />
                  <span>Travels</span>
                </div>
              )}
              {crew.imdbLink && (
                <a
                  href={crew.imdbLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-xs font-semibold px-2 py-1 rounded-full transition-all duration-300 hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.25) 100%)',
                    color: '#b45309',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    boxShadow: '0 2px 6px rgba(251, 191, 36, 0.2)'
                  }}
                >
                  <Globe className="w-3 h-3 mr-1" />
                  <span>IMDb</span>
                  <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Professional details section */}
      <div className="relative px-3 py-2 space-y-2 z-10 flex-1">
        {/* Glass divider */}
        <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-indigo-300/60 to-transparent shadow-sm"></div>
        
        {/* Location and Experience */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 text-sm">
          <div className="flex items-center px-3 py-1.5 rounded-lg backdrop-blur-md shadow-sm w-full sm:w-auto" style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.5) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
          }}>
            <MapPin className="w-3.5 h-3.5 mr-1.5 text-indigo-600 flex-shrink-0" />
            <span className="truncate font-semibold text-gray-800 dark:text-gray-200 text-xs sm:text-sm">{formatLocation()}</span>
          </div>
          <div className="flex items-center px-3 py-1.5 rounded-lg backdrop-blur-md shadow-sm w-full sm:w-auto" style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.5) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            boxShadow: '0 2px 8px rgba(168, 85, 247, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
          }}>
            <Calendar className="w-3.5 h-3.5 mr-1.5 text-purple-600 flex-shrink-0" />
            <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs sm:text-sm truncate">{getExperienceText()}</span>
          </div>
        </div>

        {/* Availability */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5">
          <div className="flex items-center w-full sm:flex-1 px-3 py-2 rounded-lg backdrop-blur-md" style={{
            background: crew.availability 
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.2) 100%)'
              : 'linear-gradient(135deg, rgba(251, 146, 60, 0.15) 0%, rgba(249, 115, 22, 0.2) 100%)',
            border: crew.availability 
              ? '1px solid rgba(16, 185, 129, 0.3)'
              : '1px solid rgba(251, 146, 60, 0.3)',
            boxShadow: crew.availability
              ? '0 4px 10px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
              : '0 4px 10px rgba(251, 146, 60, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
          }}>
            <div className={`w-2 h-2 rounded-full mr-2 shadow-md ${crew.availability ? 'bg-green-500' : 'bg-orange-500'}`}></div>
            <span className={`text-xs font-bold truncate ${crew.availability ? 'text-green-800 dark:text-green-600' : 'text-orange-800 dark:text-orange-600'}`}>
              {getAvailabilityText()}
            </span>
          </div>
          <div className="flex items-center text-sm px-3 py-2 rounded-lg backdrop-blur-md shadow-sm w-full sm:w-auto" style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.5) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
          }}>
            <IndianRupee className="w-3.5 h-3.5 mr-1 text-indigo-600 flex-shrink-0" />
            <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs truncate">{getBudgetRange()}</span>
          </div>
        </div>

        {/* Skills and Languages */}
        <div className="space-y-2">
          {crew.languages && crew.languages.length > 0 && (
            <div className="flex items-center">
              <div className="p-1.5 rounded-lg mr-2 shadow-md" style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.25) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                boxShadow: '0 2px 6px rgba(99, 102, 241, 0.2)'
              }}>
                <Languages className="w-3.5 h-3.5 text-indigo-700" />
              </div>
              <div className="flex flex-wrap gap-1">
                {crew.languages.slice(0, 3).map((language) => (
                  <Badge
                    key={language}
                    variant="secondary"
                    className="text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm hover:shadow-md transition-all duration-300"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(249, 250, 251, 0.95) 100%)',
                      color: '#1f2937',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                      boxShadow: '0 2px 6px rgba(99, 102, 241, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
                    }}
                  >
                    {language}
                  </Badge>
                ))}
                {crew.languages.length > 3 && (
                  <Badge
                    variant="secondary"
                    className="text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm"
                    style={{
                      background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(236, 72, 153, 0.2) 100%)',
                      color: '#7c3aed',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      boxShadow: '0 2px 6px rgba(168, 85, 247, 0.15)'
                    }}
                  >
                    +{crew.languages.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {crew.projectTypes && crew.projectTypes.length > 0 && (
            <div className="flex items-center">
              <div className="p-1.5 rounded-lg mr-2 shadow-md" style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.25) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                boxShadow: '0 2px 6px rgba(99, 102, 241, 0.2)'
              }}>
                <Film className="w-3.5 h-3.5 text-indigo-700" />
              </div>
              <div className="flex flex-wrap gap-1">
                {crew.projectTypes.slice(0, 3).map((type) => (
                  <Badge
                    key={type}
                    variant="secondary"
                    className="text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm hover:shadow-md transition-all duration-300"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(249, 250, 251, 0.95) 100%)',
                      color: '#1f2937',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                      boxShadow: '0 2px 6px rgba(99, 102, 241, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
                    }}
                  >
                    {type}
                  </Badge>
                ))}
                {crew.projectTypes.length > 3 && (
                  <Badge
                    variant="secondary"
                    className="text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm"
                    style={{
                      background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(236, 72, 153, 0.2) 100%)',
                      color: '#7c3aed',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      boxShadow: '0 2px 6px rgba(168, 85, 247, 0.15)'
                    }}
                  >
                    +{crew.projectTypes.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contact and actions section */}
      <div className="relative px-3 py-2 mt-auto flex-shrink-0 z-10" style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(249, 250, 251, 0.85) 50%, rgba(243, 244, 246, 0.9) 100%)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(99, 102, 241, 0.15)'
      }}>
        {/* Glass divider */}
        <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-indigo-300/70 via-purple-300/70 to-transparent shadow-sm"></div>
        
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2">
          <Link href={`/crew/${slugifyName(crew.user.name)}`} className="flex-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full font-bold rounded-xl transition-all duration-300 hover:scale-105 text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 shadow-md hover:shadow-lg"
            >
              View Full Profile
            </Button>
          </Link>

          {/* Contact options */}
          {session?.user?.role === 'EMPLOYER' && (
          <div className="flex justify-center sm:justify-start space-x-2">
            {crew.user.email && (
              <a
                href={`mailto:${crew.user.email}`}
                title="Send email"
                className="p-2 rounded-lg transition-all duration-300 hover:scale-110"
                style={{
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.2) 100%)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  boxShadow: '0 2px 6px rgba(99, 102, 241, 0.2)'
                }}
              >
                <Mail className="w-4 h-4 text-indigo-700" />
              </a>
            )}

            {crew.user.phone && (
              <a
                href={`tel:${crew.user.phone}`}
                title="Call"
                className="p-2 rounded-lg transition-all duration-300 hover:scale-110"
                style={{
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.2) 100%)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  boxShadow: '0 2px 6px rgba(99, 102, 241, 0.2)'
                }}
              >
                <Phone className="w-4 h-4 text-indigo-700" />
              </a>
            )}

            {crew.contactWhatsApp && (
              <a
                href={`https://wa.me/${crew.contactWhatsApp}`}
                target="_blank"
                rel="noopener noreferrer"
                title="WhatsApp"
                className="p-2 rounded-lg transition-all duration-300 hover:scale-110"
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.2) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.2)'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-700" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </a>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  )
}
