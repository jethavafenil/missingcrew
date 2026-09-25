'use client'

import { useState } from 'react'
import { Button } from '../ui/button'

interface CrewMember {
  id: string;
  name: string;
  role: string;
  location: string;
  availability: string;
  experience: string;
  budget: number;
  languages: string[];
  hasPortfolio: boolean;
}

interface CrewSearchProps {
  onResults: (results: CrewMember[]) => void
}

export function CrewSearch({ onResults }: CrewSearchProps) {
  const [filters, setFilters] = useState({
    role: '',
    location: '',
    availability: '',
    experience: '',
    budgetMin: '',
    budgetMax: '',
    languages: [] as string[],
    hasPortfolio: false
  })

  const [isLoading, setIsLoading] = useState(false)

  const searchCrew = async () => {
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v))
          } else {
            queryParams.append(key, value.toString())
          }
        }
      })

      const response = await fetch(`/api/crew/search?${queryParams}`)
      if (response.ok) {
        const data = await response.json()
        onResults(data.crew)
      }
    } catch (error) {
      console.error('Error searching crew:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">Find Crew Members</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Role Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select
            value={filters.role}
            onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
            className="w-full border border-gray-300 rounded-md p-2"
          >
            <option value="">All Roles</option>
            <option value="Director of Photography">DOP</option>
            <option value="Assistant Director">AD</option>
            <option value="Line Producer">Line Producer</option>
          </select>
        </div>

        {/* Location Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <select
            value={filters.location}
            onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
            className="w-full border border-gray-300 rounded-md p-2"
          >
            <option value="">All Locations</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Delhi">Delhi</option>
            <option value="Bangalore">Bangalore</option>
          </select>
        </div>

        {/* Availability Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
          <select
            value={filters.availability}
            onChange={(e) => setFilters(prev => ({ ...prev, availability: e.target.value }))}
            className="w-full border border-gray-300 rounded-md p-2"
          >
            <option value="">Any</option>
            <option value="available">Available Now</option>
            <option value="booked">Currently Booked</option>
          </select>
        </div>
      </div>

      <Button onClick={searchCrew} disabled={isLoading} className="w-full">
        {isLoading ? 'Searching...' : 'Search Crew'}
      </Button>
    </div>
  )
}
