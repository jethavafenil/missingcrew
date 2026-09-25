'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from '@/lib/auth/session-context'
import { useRouter, useSearchParams } from 'next/navigation'
import { CrewCard } from '@/components/crew/CrewCard'
import { CrewFilters } from '@/components/crew/CrewFilters'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Filter, SlidersHorizontal, Grid3x3, LayoutGrid, X } from 'lucide-react'

interface PastProject {
  title?: string
  year?: number
  role?: string
  link?: string | null
  notes?: string | null
}

interface CrewMember {
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

function BrowseCrewContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([])
  const [filteredCrew, setFilteredCrew] = useState<CrewMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState<string>('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  // Parse URL parameters to initialize filters
  const getInitialFilters = () => {
    const role = searchParams.get('role') || ''
    const location = searchParams.get('location') || ''
    const availability = searchParams.get('availability') || ''
    const experience = searchParams.get('experience') || ''
    const budgetMin = searchParams.get('budgetMin') || ''
    const budgetMax = searchParams.get('budgetMax') || ''
    const projectType = searchParams.get('projectType') || ''

    // Handle languages which could be a comma-separated list
    const languagesParam = searchParams.get('languages')
    const languages = languagesParam ? languagesParam.split(',') : [] as string[]

    // Handle hasPortfolio which is a boolean
    const hasPortfolio = searchParams.get('hasPortfolio') === 'true'

    return {
      role,
      location,
      availability,
      experience,
      budgetMin,
      budgetMax,
      languages,
      hasPortfolio,
      projectType
    }
  }

  const [filters, setFilters] = useState(getInitialFilters())

  useEffect(() => {
    fetchCrewMembers()
  }, [])

  useEffect(() => {
    let filtered = crewMembers

    // Filter by role
    if (filters.role) {
      filtered = filtered.filter(crew =>
        crew.primaryRoles.includes(filters.role)
      )
    }

    // Filter by location
    if (filters.location) {
      filtered = filtered.filter(crew =>
        crew.location?.toLowerCase().includes(filters.location.toLowerCase()) ||
        crew.city?.toLowerCase().includes(filters.location.toLowerCase())
      )
    }

    // Filter by availability
    if (filters.availability === 'available') {
      filtered = filtered.filter(crew => crew.availability)
    } else if (filters.availability === 'booked') {
      filtered = filtered.filter(crew => !crew.availability)
    }

    // Filter by experience
    if (filters.experience) {
      filtered = filtered.filter(crew =>
        crew.yearsExperience === filters.experience
      )
    }

    // Filter by budget
    if (filters.budgetMin) {
      filtered = filtered.filter(crew =>
        crew.dailyBudgetMin && crew.dailyBudgetMin >= parseInt(filters.budgetMin)
      )
    }
    if (filters.budgetMax) {
      filtered = filtered.filter(crew =>
        crew.dailyBudgetMax && crew.dailyBudgetMax <= parseInt(filters.budgetMax)
      )
    }

    // Filter by languages
    if (filters.languages.length > 0) {
      filtered = filtered.filter(crew =>
        filters.languages.every(lang => crew.languages.includes(lang))
      )
    }

    // Filter by portfolio
    if (filters.hasPortfolio) {
      filtered = filtered.filter(crew =>
        crew.portfolioLinks && crew.portfolioLinks.length > 0
      )
    }

    // Filter by project type
    if (filters.projectType) {
      filtered = filtered.filter(crew =>
        crew.projectTypes.includes(filters.projectType)
      )
    }

    // Sort by subscription tier - Pro members appear first
    filtered = [...filtered].sort((a, b) => {
      if (a.subscriptionTier === 'PRO' && b.subscriptionTier !== 'PRO') return -1
      if (a.subscriptionTier !== 'PRO' && b.subscriptionTier === 'PRO') return 1
      if (a.subscriptionTier === 'BASIC' && b.subscriptionTier === 'FREE_TRIAL') return -1
      if (a.subscriptionTier === 'FREE_TRIAL' && b.subscriptionTier === 'BASIC') return 1
      return 0
    })

    // Apply sorting
    if (sortBy === 'experience-high') {
      filtered.sort((a, b) => {
        const expA = a.yearsExperience || '0-1 years'
        const expB = b.yearsExperience || '0-1 years'
        const getExpValue = (exp: string) => {
          if (exp.includes('10+')) return 10
          const match = exp.match(/\d+/)
          return match ? parseInt(match[0]) : 0
        }
        return getExpValue(expB) - getExpValue(expA)
      })
    } else if (sortBy === 'budget-low') {
      filtered.sort((a, b) => (a.dailyBudgetMin || 0) - (b.dailyBudgetMin || 0))
    } else if (sortBy === 'budget-high') {
      filtered.sort((a, b) => (b.dailyBudgetMax || 0) - (a.dailyBudgetMax || 0))
    } else {
      // newest (default)
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    setFilteredCrew(filtered)
    // Reset to first page when filters or sorting changes
    setCurrentPage(1)
  }, [crewMembers, filters, sortBy])

  // Pagination calculations
  const totalPages = Math.ceil(filteredCrew.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCrew = filteredCrew.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(page)
    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      }
    }
    return pages
  }

  const fetchCrewMembers = async () => {
    try {
      const response = await fetch('/api/crew')
      if (response.ok) {
        const data = await response.json()
        setCrewMembers(data.crew)
      }
    } catch (error) {
      console.error('Error fetching crew members:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-blue-600/80"></div>
      </div>
    )
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.role) count++
    if (filters.location) count++
    if (filters.availability) count++
    if (filters.experience) count++
    if (filters.budgetMin || filters.budgetMax) count++
    if (filters.languages.length > 0) count++
    if (filters.hasPortfolio) count++
    if (filters.projectType) count++
    return count
  }

  const clearAllFilters = () => {
    setFilters({
      role: '',
      location: '',
      availability: '',
      experience: '',
      budgetMin: '',
      budgetMax: '',
      languages: [],
      hasPortfolio: false,
      projectType: ''
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Browse Crew Members
            </h1>
            <p className="text-gray-600 mt-2">
              Find talented film professionals for your projects
            </p>
          </div>
          {session?.user?.role === 'EMPLOYER' && (
            <Button 
              onClick={() => router.push('/post-requirement')}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              Post a Project
            </Button>
          )}
        </div>

        {/* Mobile Filter Button */}
        <div className="lg:hidden mb-4">
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full">
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {getActiveFilterCount() > 0 && (
                  <span className="ml-2 bg-indigo-600 text-white rounded-full px-2 py-0.5 text-xs">
                    {getActiveFilterCount()}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] sm:w-[400px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filter Crew</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <CrewFilters 
                  filters={filters} 
                  onFiltersChange={setFilters}
                  compact={true}
                  showAdvanced={true}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Main Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters (Desktop) */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-6 space-y-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Filter className="w-5 h-5 mr-2 text-indigo-600" />
                    Filters
                  </h2>
                  {getActiveFilterCount() > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Clear ({getActiveFilterCount()})
                    </button>
                  )}
                </div>
                <CrewFilters 
                  filters={filters} 
                  onFiltersChange={setFilters}
                  compact={true}
                  showAdvanced={showAdvancedFilters}
                />
                <Dialog open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full mt-4 border-2 hover:border-indigo-400 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all">
                      <SlidersHorizontal className="w-4 h-4 mr-2" />
                      Advanced Filters
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30">
                    <DialogHeader className="pb-4 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg">
                          <SlidersHorizontal className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-900 to-purple-900 bg-clip-text text-transparent">Advanced Filters</DialogTitle>
                          <p className="text-sm text-gray-600 mt-1">Refine your search to find the perfect crew</p>
                        </div>
                      </div>
                    </DialogHeader>
                    <div className="mt-6">
                      <CrewFilters 
                        filters={filters} 
                        onFiltersChange={setFilters}
                        showAdvanced={true}
                        compact={false}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-600">
                    Showing <span className="font-semibold text-gray-900">{startIndex + 1}-{Math.min(endIndex, filteredCrew.length)}</span> of <span className="font-semibold text-gray-900">{filteredCrew.length}</span> crew members
                  </p>
                  {getActiveFilterCount() > 0 && (
                    <span className="hidden sm:inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? 's' : ''} active
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  {/* View Mode Toggle */}
                  <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-white shadow-sm text-indigo-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      title="Grid view"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded transition-colors ${
                        viewMode === 'list'
                          ? 'bg-white shadow-sm text-indigo-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      title="List view"
                    >
                      <Grid3x3 className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Sort Dropdown */}
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 sm:flex-initial border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="newest">Newest First</option>
                    <option value="experience-high">Most Experienced</option>
                    <option value="budget-low">Budget: Low to High</option>
                    <option value="budget-high">Budget: High to Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Crew Grid/List */}
            {filteredCrew.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">👥</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No crew members found
                </h3>
                <p className="text-gray-600 mb-4">
                  {crewMembers.length === 0
                    ? 'No crew members have registered yet.'
                    : 'Try adjusting your filters to see more results.'
                  }
                </p>
                {getActiveFilterCount() > 0 && (
                  <Button onClick={clearAllFilters} variant="outline">
                    Clear All Filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className={`grid gap-6 mb-8 ${
                  viewMode === 'grid'
                    ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                    : 'grid-cols-1'
                }`}>
                  {paginatedCrew.map(crew => (
                    <CrewCard key={crew.id} crew={crew} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      {/* Page Info */}
                      <div className="text-sm text-gray-600">
                        Page <span className="font-semibold text-gray-900">{currentPage}</span> of <span className="font-semibold text-gray-900">{totalPages}</span>
                      </div>

                      {/* Pagination Controls */}
                      <div className="flex items-center space-x-2">
                        {/* Previous Button */}
                        <button
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label="Previous page"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>

                        {/* Page Numbers */}
                        <div className="hidden sm:flex items-center space-x-1">
                          {getPageNumbers().map((page, index) => (
                            page === '...' ? (
                              <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
                                ...
                              </span>
                            ) : (
                              <button
                                key={page}
                                onClick={() => goToPage(page as number)}
                                className={`px-3 py-2 rounded-lg font-medium transition-all ${
                                  currentPage === page
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            )
                          ))}
                        </div>

                        {/* Mobile: Current Page Indicator */}
                        <div className="sm:hidden px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium">
                          {currentPage} / {totalPages}
                        </div>

                        {/* Next Button */}
                        <button
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label="Next page"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>

                      {/* Items per page (future enhancement) */}
                      <div className="hidden lg:block text-sm text-gray-600">
                        {itemsPerPage} per page
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BrowseCrew() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-blue-600/80"></div>
      </div>
    }>
      <BrowseCrewContent />
    </Suspense>
  )
}
