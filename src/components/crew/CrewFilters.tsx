'use client'

import { useState, useEffect } from 'react'
import { departments } from '@/lib/departments'
import { LocationAutocomplete } from '@/components/ui/location-autocomplete'

interface CrewFiltersProps {
  filters: {
    role: string
    location: string
    availability: string
    experience: string
    budgetMin: string
    budgetMax: string
    languages: string[]
    hasPortfolio: boolean
    projectType: string
  }
  onFiltersChange: (filters: {
    role: string
    location: string
    availability: string
    experience: string
    budgetMin: string
    budgetMax: string
    languages: string[]
    hasPortfolio: boolean
    projectType: string
  }) => void
  compact?: boolean
  showAdvanced?: boolean
}

const LANGUAGES = ['Hindi', 'English', 'Tamil', 'Telugu', 'Malayalam', 'Bengali', 'Marathi']
const PROJECT_TYPES = ['Ads', 'Web Series', 'Feature Films', 'Documentary', 'Music Video', 'TV Show']
const EXPERIENCE_LEVELS = ['0-1 years', '1-3 years', '3-5 years', '5-10 years', '10+ years']

export function CrewFilters({ filters, onFiltersChange, compact = false, showAdvanced: showAdvancedProp = false }: CrewFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(showAdvancedProp)

  // Update internal state when prop changes
  useEffect(() => {
    setShowAdvanced(showAdvancedProp)
  }, [showAdvancedProp])

const updateFilter = (key: string, value: string | string[] | boolean) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const toggleLanguage = (language: string) => {
    const currentLanguages = filters.languages || []
    const newLanguages = currentLanguages.includes(language)
      ? currentLanguages.filter((lang: string) => lang !== language)
      : [...currentLanguages, language]
    
    updateFilter('languages', newLanguages)
  }

  return (
    <div className={compact ? 'space-y-4' : 'bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6 mb-6'}>
      {!compact && (
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Filters</h3>
            <p className="text-sm text-gray-600 mt-0.5">Narrow down your search</p>
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
            <span className="text-indigo-600">🎬</span> Role
          </label>
          <select
            value={filters.role}
            onChange={(e) => updateFilter('role', e.target.value)}
            className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white hover:border-indigo-400"
          >
            <option value="">All Roles</option>
            {/* Import and use all roles from departments data */}
            {departments.flatMap((department: { department: string, roles: string[] }) =>
              department.roles.map((role: string) => (
                <option key={role} value={role}>{role}</option>
              ))
            )}
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

        {/* Availability Filter */}
        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-gray-200 hover:border-indigo-300 transition-all">
          <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <span className="text-indigo-600">📅</span> Availability
          </label>
          <select
            value={filters.availability}
            onChange={(e) => updateFilter('availability', e.target.value)}
            className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white hover:border-indigo-400"
          >
            <option value="">All</option>
            <option value="available">Available Now</option>
            <option value="booked">Currently Booked</option>
          </select>
        </div>

        {/* Experience Filter */}
        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-gray-200 hover:border-indigo-300 transition-all">
          <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <span className="text-indigo-600">⭐</span> Experience
          </label>
          <select
            value={filters.experience}
            onChange={(e) => updateFilter('experience', e.target.value)}
            className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white hover:border-indigo-400"
          >
            <option value="">Any Experience</option>
            {EXPERIENCE_LEVELS.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className={compact ? 'space-y-5 pt-4 border-t' : 'border-t pt-6 space-y-6'}>
          {/* Budget Range */}
          <div className="bg-white/80 backdrop-blur-sm p-5 rounded-lg border border-gray-200">
            <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-indigo-600">💰</span> Daily Budget Range (₹)
            </label>
            <div className="flex space-x-3">
              <input
                type="number"
                placeholder="Min"
                value={filters.budgetMin}
                onChange={(e) => updateFilter('budgetMin', e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white hover:border-indigo-400"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.budgetMax}
                onChange={(e) => updateFilter('budgetMax', e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white hover:border-indigo-400"
              />
            </div>
          </div>

          {/* Languages */}
          <div className="bg-white/80 backdrop-blur-sm p-5 rounded-lg border border-gray-200">
            <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-indigo-600">🗣️</span> Languages
            </label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map(language => (
                <button
                  key={language}
                  type="button"
                  onClick={() => toggleLanguage(language)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all shadow-sm hover:shadow-md ${
                    filters.languages?.includes(language)
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-600 text-white scale-105'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-indigo-400 hover:bg-indigo-50'
                  }`}
                >
                  {language}
                </button>
              ))}
            </div>
          </div>

          {/* Project Types */}
          <div className="bg-white/80 backdrop-blur-sm p-5 rounded-lg border border-gray-200">
            <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-indigo-600">🎥</span> Project Types
            </label>
            <select
              value={filters.projectType}
              onChange={(e) => updateFilter('projectType', e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white hover:border-indigo-400"
            >
              <option value="">All Project Types</option>
              {PROJECT_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Portfolio Filter */}
          <div className="bg-white/80 backdrop-blur-sm p-5 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hasPortfolio"
                checked={filters.hasPortfolio}
                onChange={(e) => updateFilter('hasPortfolio', e.target.checked)}
                className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="hasPortfolio" className="ml-3 flex items-center gap-2 text-sm font-semibold text-gray-800 cursor-pointer">
                <span className="text-indigo-600">📁</span> Only show crew with portfolio
              </label>
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
              location: '',
              availability: '',
              experience: '',
              budgetMin: '',
              budgetMax: '',
              languages: [],
              hasPortfolio: false,
              projectType: ''
            })}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all shadow-sm hover:shadow-md"
          >
            Clear all filters
          </button>
          <p className="text-xs text-gray-500">Tip: Use advanced filters for more precise results</p>
        </div>
      )}
    </div>
  )
}
