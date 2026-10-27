'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSession } from '@/lib/auth/session-context'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ProjectCardWrapper } from '@/components/projects/ProjectCardWrapper'
import { ProjectFilters } from '@/components/projects/ProjectFilters'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Filter, SlidersHorizontal, Grid3x3, LayoutGrid, X } from 'lucide-react'
import { shootTimestamp } from '@/lib/projects/format'
import { EMPTY_PROJECT_FILTERS, activeProjectFilterCount, filterProjects as applyProjectFilters, projectFilterChips, projectFiltersFromParams, type ProjectFilterState } from '@/lib/projectFilters'
import { toggleIn } from '@/lib/crewFilters'

interface Project {
  id: string
  projectName: string
  projectType: string
  rolesNeeded: string[]
  shootStartDate: string | null
  shootEndDate: string | null
  budgetMin?: number | null
  budgetMax?: number | null
  budgetFixed?: boolean | null
  productionHouse?: string | null
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

function FindWorkContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState<string>('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12
  const [filters, setFilters] = useState<ProjectFilterState>({ ...EMPTY_PROJECT_FILTERS })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/accounts?tab=signin')
    } else if (session?.user?.role === 'EMPLOYER') {
      router.push('/dashboard')
    }
  }, [session, status, router])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterProjects = useCallback(() => {
    const filtered = applyProjectFilters(projects, filters)

    // Apply sorting (projects without dates go last)
    const byStart = (dir: 1 | -1) => (a: Project, b: Project) => {
      const ta = shootTimestamp(a.shootStartDate)
      const tb = shootTimestamp(b.shootStartDate)
      if (ta === null && tb === null) return 0
      if (ta === null) return 1
      if (tb === null) return -1
      return (ta - tb) * dir
    }
    if (sortBy === 'start-date') {
      filtered.sort(byStart(1))
    } else if (sortBy === 'applications') {
      filtered.sort((a, b) => a._count.applications - b._count.applications)
    } else {
      // newest (default)
      filtered.sort(byStart(-1))
    }

    setFilteredProjects(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [projects, filters, sortBy])

  useEffect(() => {
    fetchProjects()
  }, [])

  // Initialize filters from URL query params (role(s), projectType(s), tag(s), location, dateRange)
  useEffect(() => {
    const fromUrl = projectFiltersFromParams((name) => searchParams.get(name))
    if (fromUrl.roles.length || fromUrl.projectTypes.length || fromUrl.tags.length || fromUrl.location || fromUrl.dateRange) {
      setFilters(fromUrl)
    }
  }, [searchParams])

  useEffect(() => {
    filterProjects()
  }, [filterProjects])

  // Pagination calculations
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProjects = filteredProjects.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(page)
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

  const getActiveFilterCount = () => activeProjectFilterCount(filters)

  const clearAllFilters = () => {
    setFilters({ ...EMPTY_PROJECT_FILTERS })
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Find Work
            </h1>
            <p className="text-gray-600 mt-2">
              Browse available projects and apply to gigs that match your skills
            </p>
          </div>
          <Button 
            onClick={() => router.push('/dashboard?tab=applications')}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            View My Applications
          </Button>
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
                <SheetTitle>Filter Projects</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <ProjectFilters 
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
                <ProjectFilters 
                  filters={filters} 
                  onFiltersChange={setFilters}
                  compact={true}
                />
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Selected filters: one click removes any of them */}
            {projectFilterChips(filters).length > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {projectFilterChips(filters).map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => setFilters(chip.remove(filters))}
                    className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-800 hover:bg-indigo-100"
                    aria-label={`Remove filter ${chip.label}`}
                  >
                    {chip.label}
                    <span aria-hidden="true">×</span>
                  </button>
                ))}
                <button type="button" onClick={clearAllFilters} className="text-sm font-medium text-gray-500 underline hover:text-gray-800">
                  Clear all
                </button>
              </div>
            )}

            {/* Toolbar */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-600">
                    Showing <span className="font-semibold text-gray-900">{startIndex + 1}-{Math.min(endIndex, filteredProjects.length)}</span> of <span className="font-semibold text-gray-900">{filteredProjects.length}</span> projects
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
                    <option value="start-date">Start Date</option>
                    <option value="applications">Fewest Applications</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Projects Grid/List */}
            {filteredProjects.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">🎬</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No projects found
                </h3>
                <p className="text-gray-600 mb-4">
                  {projects.length === 0
                    ? 'No projects have been posted yet.'
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
                  {paginatedProjects.map(project => (
                    <ProjectCardWrapper
                      key={project.id}
                      project={project}
                      onApply={() => fetchProjects()}
                    />
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

                      {/* Items per page */}
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

export default function FindWork() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <FindWorkContent />
    </Suspense>
  )
}
