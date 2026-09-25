'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/lib/auth/session-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { slugifyName } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Heart, MapPin, Briefcase, DollarSign, Mail, Phone, RefreshCw, Search, ArrowLeft } from 'lucide-react'

interface WishlistCrew {
  id: string
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
    dailyBudgetMin: number | null
    dailyBudgetMax: number | null
  }
  createdAt: string
}

export default function WishlistPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [wishlists, setWishlists] = useState<WishlistCrew[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/accounts?tab=signin&role=employer')
    } else if (status === 'authenticated' && session?.user?.role !== 'EMPLOYER') {
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
        setWishlists(data.wishlists)
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const removeFromWishlist = async (crewId: string) => {
    try {
      const response = await fetch(`/api/wishlist?crewId=${crewId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setWishlists(wishlists.filter(w => w.crew.id !== crewId))
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error)
    }
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
              <p className="text-gray-600 mt-2">
                Your saved crew members ({wishlists.length})
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={fetchWishlist}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
            <Link href="/browse-crew">
              <Button className="flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <span>Browse More Crew</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Wishlist Grid */}
        {wishlists.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {wishlists.map((wishlist) => (
              <Card key={wishlist.id} className="border-l-4 border-red-500 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-16 w-16 border-2 border-red-200">
                        {wishlist.crew.photo ? (
                          <AvatarImage src={wishlist.crew.photo} alt={wishlist.crew.user.name} />
                        ) : null}
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-lg">
                          {wishlist.crew.user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {wishlist.crew.user.name}
                        </h3>
                        {wishlist.crew.primaryRoles && wishlist.crew.primaryRoles.length > 0 && (
                          <p className="text-sm text-gray-600">
                            {Array.isArray(wishlist.crew.primaryRoles)
                              ? wishlist.crew.primaryRoles[0]
                              : 'N/A'}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromWishlist(wishlist.crew.id)}
                      className="text-red-500 hover:text-red-700 transition-colors p-2"
                      title="Remove from wishlist"
                    >
                      <Heart className="h-6 w-6 fill-current" />
                    </button>
                  </div>

                  <div className="space-y-3 mb-4">
                    {wishlist.crew.city && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                        {wishlist.crew.city}
                      </div>
                    )}
                    {wishlist.crew.yearsExperience && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Briefcase className="h-4 w-4 mr-2 text-gray-500" />
                        {wishlist.crew.yearsExperience}
                      </div>
                    )}
                    {(wishlist.crew.dailyBudgetMin || wishlist.crew.dailyBudgetMax) && (
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                        {wishlist.crew.dailyBudgetMin && wishlist.crew.dailyBudgetMax
                          ? `₹${wishlist.crew.dailyBudgetMin.toLocaleString()} - ₹${wishlist.crew.dailyBudgetMax.toLocaleString()}/day`
                          : wishlist.crew.dailyBudgetMin
                          ? `From ₹${wishlist.crew.dailyBudgetMin.toLocaleString()}/day`
                          : wishlist.crew.dailyBudgetMax ? `Up to ₹${wishlist.crew.dailyBudgetMax.toLocaleString()}/day` : ''}
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Link
                      href={`/crew/${slugifyName(wishlist.crew.user.name)}`}
                      className="flex-1 text-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      View Profile
                    </Link>
                    {wishlist.crew.user.email && (
                      <a
                        href={`mailto:${wishlist.crew.user.email}`}
                        className="p-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                        title="Send email"
                      >
                        <Mail className="h-5 w-5" />
                      </a>
                    )}
                    {wishlist.crew.user.phone && (
                      <a
                        href={`tel:${wishlist.crew.user.phone}`}
                        className="p-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                        title="Call"
                      >
                        <Phone className="h-5 w-5" />
                      </a>
                    )}
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
                  Start building your list of favorite crew members by clicking the heart icon on crew profiles.
                </p>
                <Link href="/browse-crew">
                  <Button className="flex items-center space-x-2 mx-auto">
                    <Search className="h-4 w-4" />
                    <span>Browse Crew Members</span>
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
