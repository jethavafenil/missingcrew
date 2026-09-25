'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/lib/auth/session-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { slugifyName } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Heart, MapPin, Calendar, Film, Users, Briefcase, RefreshCw, Search, ArrowLeft, Trash2 } from 'lucide-react'

interface WishlistProject {
  id: string
  project: {
    id: string
    projectName: string
    projectType: string
    location: string
    description: string
    shootStartDate: string
    shootEndDate: string
    rolesNeeded: Array<string | { role: string, count?: number }>
    employer: {
      user: {
        name: string
      }
    }
    _count: {
      applications: number
    }
  }
  createdAt: string
}

export default function CrewWishlistPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [wishlists, setWishlists] = useState<WishlistProject[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/accounts?tab=signin&role=crew')
    } else if (status === 'authenticated' && session?.user?.role !== 'CREW') {
      router.push('/dashboard')
    } else if (status === 'authenticated') {
      fetchWishlist()
    }
  }, [status, session, router])

  const fetchWishlist = async () => {
    try {
      const response = await fetch('/api/wishlist')
      if (response.ok) {
        const data = await response.json()
        // Filter only project wishlists
        const projectWishlists = data.wishlists.filter((w: any) => w.project !== null)
        setWishlists(projectWishlists)
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const removeFromWishlist = async (projectId: string) => {
    try {
      const response = await fetch(`/api/wishlist?projectId=${projectId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setWishlists(wishlists.filter(w => w.project.id !== projectId))
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-blue-600/80"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <div className="flex items-center mb-2">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
            </div>
            <p className="text-gray-600 mt-2">
              Projects you&apos;ve saved for later ({wishlists.length})
            </p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <Button
              onClick={fetchWishlist}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
            <Link href="/find-work">
              <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700">
                <Search className="h-4 w-4" />
                <span>Browse More Projects</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Wishlist Grid */}
        {wishlists.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {wishlists.map((wishlist) => (
              <Card key={wishlist.id} className="border-l-4 border-red-500 hover:shadow-lg transition-shadow relative group">
                <CardContent className="pt-6">
                  {/* Remove button */}
                  <button
                    onClick={() => removeFromWishlist(wishlist.project.id)}
                    className="absolute top-4 right-4 p-2 rounded-lg bg-red-50 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  {/* Project Name */}
                  <h3 className="font-semibold text-gray-900 text-lg mb-3 pr-8">
                    {wishlist.project.projectName}
                  </h3>

                  {/* Project Type */}
                  <Badge variant="secondary" className="mb-3">
                    {wishlist.project.projectType}
                  </Badge>

                  {/* Location */}
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                    {wishlist.project.location}
                  </div>

                  {/* Dates */}
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    {formatDate(wishlist.project.shootStartDate)} - {formatDate(wishlist.project.shootEndDate)}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                    {wishlist.project.description}
                  </p>

                  {/* Roles Needed */}
                  <div className="mb-4">
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Film className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="font-medium">Roles Needed:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {wishlist.project.rolesNeeded.slice(0, 3).map((roleItem, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {typeof roleItem === 'string' ? roleItem : roleItem.role}
                        </Badge>
                      ))}
                      {wishlist.project.rolesNeeded.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{wishlist.project.rolesNeeded.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Posted By */}
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <Briefcase className="h-4 w-4 mr-2 text-gray-500" />
                    Posted by {wishlist.project.employer.user.name}
                  </div>

                  {/* Applications Count */}
                  {wishlist.project._count.applications > 0 && (
                    <div className="flex items-center text-sm text-gray-600 mb-4">
                      <Users className="h-4 w-4 mr-2 text-gray-500" />
                      {wishlist.project._count.applications} applicant{wishlist.project._count.applications !== 1 ? 's' : ''}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Link
                      href={`/projects/${slugifyName(wishlist.project.projectName)}`}
                      className="flex-1"
                    >
                      <Button variant="default" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Your wishlist is empty
                </h3>
                <p className="text-gray-600 mb-6">
                  Start saving projects you&apos;re interested in by clicking the heart icon
                </p>
                <Link href="/find-work">
                  <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700">
                    <Search className="h-4 w-4 mr-2" />
                    Browse Projects
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
