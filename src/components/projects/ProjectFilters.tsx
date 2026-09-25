'use client'

import { useState, useEffect } from 'react'
import { LocationAutocomplete } from '@/components/ui/location-autocomplete'
import { departments } from '@/lib/departments'

interface ProjectFiltersProps {
  filters: {
    role: string
    projectType: string
    location: string
    dateRange: string
  }
  onFiltersChange: (filters: { role: string; projectType: string; location: string; dateRange: string }) => void
  compact?: boolean
  showAdvanced?: boolean
}

const PROJECT_TYPES = ['Ads', 'Web Series', 'Feature Films', 'Documentary', 'Music Video', 'TV Show']

export function ProjectFilters({ filters, onFiltersChange, compact = false, showAdvanced: showAdvancedProp = false }: ProjectFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(showAdvancedProp)

  // Update internal state when prop changes
  useEffect(() => {
    setShowAdvanced(showAdvancedProp)
  }, [showAdvancedProp])

  // Get all roles from departments
  const allRoles = departments.flatMap(dept => dept.roles)

const updateFilter = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  return (
    <div className={compact ? 'space-y-4' : 'bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6 mb-6'}>
      {!compact && (
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Project Filters</h3>
            <p className="text-sm text-gray-600 mt-0.5">Find the perfect project</p>
          </div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow-md"
          >
            {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
          </button>
        </div>
      )}

      {/* Basic Filters */}
      <div className={compact ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 gap-5 mb-6'}>
        {/* Role Filter */}
        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-gray-200 hover:border-indigo-300 transition-all">
          <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <span className="text-indigo-600">🎬</span> Role Needed
          </label>
          <select
            value={filters.role}
            onChange={(e) => updateFilter('role', e.target.value)}
            className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white hover:border-indigo-400"
          >
            <option value="">All Roles</option>
            {allRoles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>

        {/* Project Type Filter */}
        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-gray-200 hover:border-indigo-300 transition-all">
          <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <span className="text-indigo-600">🎥</span> Project Type
          </label>
          <select
            value={filters.projectType}
            onChange={(e) => updateFilter('projectType', e.target.value)}
            className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white hover:border-indigo-400"
          >
            <option value="">All Types</option>
            {PROJECT_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Location Filter */}
        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-gray-200 hover:border-indigo-300 transition-all">
          <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <span className="text-indigo-600">📍</span> Location
          </label>
          <LocationAutocomplete
            label=""
            value={filters.location}
            onChange={(value) => updateFilter('location', value)}
            placeholder="City or state"
            className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white hover:border-indigo-400"
          />
        </div>

        {/* Date Range Filter */}
        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-gray-200 hover:border-indigo-300 transition-all">
          <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <span className="text-indigo-600">📅</span> Date Range
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => updateFilter('dateRange', e.target.value)}
            className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white hover:border-indigo-400"
          >
            <option value="">Any Time</option>
            <option value="this_week">This Week</option>
            <option value="next_week">Next Week</option>
            <option value="this_month">This Month</option>
            <option value="next_month">Next Month</option>
          </select>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className={compact ? 'space-y-5 pt-4 border-t' : 'border-t pt-6 space-y-6'}>
          {/* Budget Range - Future Enhancement */}
          <div className="bg-white/80 backdrop-blur-sm p-5 rounded-lg border border-gray-200">
            <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-indigo-600">💰</span> Budget Range
            </label>
            <div className="text-sm text-gray-600 italic p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              🕒 Budget filtering will be available soon.
            </div>
          </div>
          
          {/* Additional filters placeholder */}
          <div className="bg-white/80 backdrop-blur-sm p-5 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 italic p-3 bg-purple-50 rounded-lg border border-purple-200">
              ✨ More advanced filtering options coming soon.
            </div>
          </div>
        </div>
      )}

      {/* Clear Filters */}
      {!compact && (
        <div className="flex justify-between items-center mt-6 pt-5 border-t border-gray-200">
          <button
            onClick={() => onFiltersChange({
              role: '',
              projectType: '',
              location: '',
              dateRange: ''
            })}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all shadow-sm hover:shadow-md"
          >
            Clear all filters
          </button>
          <p className="text-xs text-gray-500">Tip: Combine filters to find the best matches</p>
        </div>
      )}
    </div>
  )
}
