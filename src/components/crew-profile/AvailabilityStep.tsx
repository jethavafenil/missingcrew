'use client'

import { useState } from 'react'

interface AvailabilityData {
  availability?: boolean
  availabilityStart?: string
  availabilityEnd?: string
  projectTypes?: string[]
  dailyBudgetMin?: number
  dailyBudgetMax?: number
  budgetFlexible?: boolean
  availableToTravel?: boolean
}

interface AvailabilityStepProps {
  data: Partial<AvailabilityData>
  onChange: (data: Partial<AvailabilityData>) => void
}

export function AvailabilityStep({ data, onChange }: AvailabilityStepProps) {
  const [availability, setAvailability] = useState(Boolean(data.availability))

  const handleAvailabilityToggle = (isAvailable: boolean) => {
    setAvailability(isAvailable)
    onChange({ 
      availability: isAvailable,
      // Clear dates if not available
      ...(isAvailable ? {} : { availabilityStart: undefined, availabilityEnd: undefined })
    })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Availability & Budget</h2>

      {/* Availability Toggle */}
      <div className="flex items-center justify-between p-6 border rounded-lg bg-gray-50">
        <div>
          <h3 className="font-medium text-gray-900">Current Availability</h3>
          <p className="text-sm text-gray-600">Are you currently available for work?</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => handleAvailabilityToggle(true)}
            className={`px-4 py-2 rounded-lg border ${
              availability
                ? 'bg-green-500 text-white border-green-500'
                : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            Available
          </button>
          <button
            type="button"
            onClick={() => handleAvailabilityToggle(false)}
            className={`px-4 py-2 rounded-lg border ${
              !availability
                ? 'bg-red-500 text-white border-red-500'
                : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            Booked
          </button>
        </div>
      </div>

      {/* Availability Dates */}
      {availability && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="availabilityStart" className="block text-sm font-medium text-gray-700">
              Available From
            </label>
            <input
              type="date"
              id="availabilityStart"
              value={data.availabilityStart || ''}
              onChange={(e) => onChange({ availabilityStart: e.target.value, availableToTravel: true })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="availabilityEnd" className="block text-sm font-medium text-gray-700">
              Available Until (Optional)
            </label>
            <input
              type="date"
              id="availabilityEnd"
              value={data.availabilityEnd || ''}
              onChange={(e) => onChange({ availabilityEnd: e.target.value, availableToTravel: true })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Project Types */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Project Types You Work On *
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            'Ads', 'Web Series', 'Feature Films', 'Documentary', 
            'Music Video', 'TV Show', 'Short Film', 'Corporate Video'
          ].map(type => (
            <button
              key={type}
              type="button"
              onClick={() => {
                const currentTypes = data.projectTypes || []
                const newTypes = currentTypes.includes(type)
                  ? currentTypes.filter(t => t !== type)
                  : [...currentTypes, type]
                onChange({ projectTypes: newTypes })
              }}
              className={`p-3 border rounded-lg text-left transition-colors ${
                (data.projectTypes || []).includes(type)
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Daily Budget Range */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Daily Budget Range (₹) *
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="dailyBudgetMin" className="block text-xs text-gray-500 mb-1">
                Minimum
              </label>
              <input
                type="number"
                id="dailyBudgetMin"
                placeholder="5000"
                value={data.dailyBudgetMin || ''}
                onChange={(e) => onChange({ dailyBudgetMin: parseInt(e.target.value) || 0 })}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="dailyBudgetMax" className="block text-xs text-gray-500 mb-1">
                Maximum
              </label>
              <input
                type="number"
                id="dailyBudgetMax"
                placeholder="25000"
                value={data.dailyBudgetMax || ''}
                onChange={(e) => onChange({ dailyBudgetMax: parseInt(e.target.value) || 0 })}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Budget Flexible */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="budgetFlexible"
            checked={data.budgetFlexible || false}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ budgetFlexible: e.target.checked })}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="budgetFlexible" className="ml-2 block text-sm text-gray-700">
            My budget is flexible depending on the project
          </label>
        </div>
      </div>

    </div>
  )
}