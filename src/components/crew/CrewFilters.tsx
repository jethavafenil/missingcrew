'use client'

import { useEffect, useMemo, useState } from 'react'
import { departments } from '@/lib/departments'
import { LocationAutocomplete } from '@/components/ui/location-autocomplete'
import { MultiSelect } from '@/components/ui/multi-select'
import { PROJECT_TYPES } from '@/lib/projectTypes'
import { PREMADE_TAGS, premadeValue } from '@/lib/projectTags'
import { EMPTY_CREW_FILTERS, toggleIn, type CrewFilterState } from '@/lib/crewFilters'

interface CrewFiltersProps {
  filters: CrewFilterState
  onFiltersChange: (filters: CrewFilterState) => void
  compact?: boolean
  showAdvanced?: boolean
}

const LANGUAGES = ['Hindi', 'English', 'Tamil', 'Telugu', 'Malayalam', 'Bengali', 'Marathi']
const EXPERIENCE_LEVELS = ['0-1 years', '1-3 years', '3-5 years', '5-10 years', '10+ years']
const GENDERS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
]

const box = 'rounded-lg border border-gray-200 bg-white/80 p-3'
const labelClass = 'mb-2 block text-sm font-semibold text-gray-800'
const input = 'w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-indigo-400'

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${on ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 bg-white text-gray-700 hover:border-indigo-400 hover:bg-indigo-50'}`}
    >
      {children}
    </button>
  )
}

// Every filter applies as soon as it is changed. Lists are multi-select.
export function CrewFilters({ filters, onFiltersChange, compact = false, showAdvanced: showAdvancedProp = false }: CrewFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(showAdvancedProp)
  useEffect(() => setShowAdvanced(showAdvancedProp), [showAdvancedProp])

  const set = <K extends keyof CrewFilterState>(key: K, value: CrewFilterState[K]) => onFiltersChange({ ...filters, [key]: value })

  const roleOptions = useMemo(() => Array.from(new Set(departments.flatMap((d) => d.roles))).map((r) => ({ value: r })), [])
  const tagOptions = useMemo(() => PREMADE_TAGS.map((t) => ({ value: premadeValue(t), label: `#${premadeValue(t)}` })), [])

  return (
    <div className={compact ? 'space-y-3' : 'mb-6 space-y-3 rounded-xl border border-gray-200 bg-white/90 p-5 shadow-sm backdrop-blur-sm'}>
      {!compact && (
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Filters</h3>
            <p className="text-sm text-gray-600">Tick several options in a list to see all of them</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm"
          >
            {showAdvanced ? 'Hide more' : 'More filters'}
          </button>
        </div>
      )}

      <div className={compact ? 'space-y-3' : 'grid grid-cols-1 gap-3 md:grid-cols-2'}>
        <div className={box}>
          <span className={labelClass}>🎬 Roles</span>
          <MultiSelect label="Roles" options={roleOptions} value={filters.roles} onChange={(v) => set('roles', v)} placeholder="All roles" />
        </div>

        <div className={box}>
          <span className={labelClass}># Hashtags</span>
          <MultiSelect label="Hashtags" options={tagOptions} value={filters.tags} onChange={(v) => set('tags', v)} placeholder="Any hashtag" />
        </div>

        <div className={box}>
          <span className={labelClass}>🎥 Project types</span>
          <div className="flex flex-wrap gap-1.5">
            {PROJECT_TYPES.map((t) => (
              <Chip key={t} on={filters.projectTypes.includes(t)} onClick={() => set('projectTypes', toggleIn(filters.projectTypes, t))}>
                {t}
              </Chip>
            ))}
          </div>
        </div>

        <div className={box}>
          <span className={labelClass}>👤 Gender</span>
          <div className="flex flex-wrap gap-1.5">
            {GENDERS.map((g) => (
              <Chip key={g.value} on={filters.genders.includes(g.value)} onClick={() => set('genders', toggleIn(filters.genders, g.value))}>
                {g.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className={box}>
          <span className={labelClass}>📍 Location</span>
          <LocationAutocomplete label="" value={filters.location} onChange={(v) => set('location', v)} placeholder="City or state" className={input} />
        </div>

        <div className={box}>
          <span className={labelClass}>📅 Availability</span>
          <div className="mb-2 flex flex-wrap gap-1.5">
            <Chip on={filters.availability === ''} onClick={() => set('availability', '')}>Any</Chip>
            <Chip on={filters.availability === 'available'} onClick={() => set('availability', 'available')}>Available now</Chip>
            <Chip on={filters.availability === 'booked'} onClick={() => set('availability', 'booked')}>Booked</Chip>
          </div>
          <label htmlFor="availableOn" className="mb-1 block text-xs text-gray-500">Free on a date</label>
          <input id="availableOn" type="date" value={filters.availableOn} onChange={(e) => set('availableOn', e.target.value)} className={input} />
        </div>
      </div>

      {showAdvanced && (
        <div className={`space-y-3 border-t pt-3 ${compact ? '' : 'md:grid md:grid-cols-2 md:gap-3 md:space-y-0'}`}>
          <div className={box}>
            <label htmlFor="experience" className={labelClass}>⭐ Experience</label>
            <select id="experience" value={filters.experience} onChange={(e) => set('experience', e.target.value)} className={input}>
              <option value="">Any experience</option>
              {EXPERIENCE_LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div className={box}>
            <span className={labelClass}>💰 Daily budget (₹)</span>
            <div className="flex gap-2">
              <input type="number" placeholder="Min" value={filters.budgetMin} onChange={(e) => set('budgetMin', e.target.value)} className={input} />
              <input type="number" placeholder="Max" value={filters.budgetMax} onChange={(e) => set('budgetMax', e.target.value)} className={input} />
            </div>
          </div>

          <div className={box}>
            <span className={labelClass}>🗣️ Languages</span>
            <div className="flex flex-wrap gap-1.5">
              {LANGUAGES.map((l) => (
                <Chip key={l} on={filters.languages.includes(l)} onClick={() => set('languages', toggleIn(filters.languages, l))}>
                  {l}
                </Chip>
              ))}
            </div>
          </div>

          <div className={`${box} flex items-center`}>
            <input type="checkbox" id="hasPortfolio" checked={filters.hasPortfolio} onChange={(e) => set('hasPortfolio', e.target.checked)} className="h-5 w-5 cursor-pointer rounded border-gray-300 text-indigo-600" />
            <label htmlFor="hasPortfolio" className="ml-3 cursor-pointer text-sm font-semibold text-gray-800">📁 Only crew with a portfolio</label>
          </div>
        </div>
      )}

      {!compact && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <button type="button" onClick={() => onFiltersChange({ ...EMPTY_CREW_FILTERS })} className="rounded-lg bg-gray-100 px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-200">
            Clear all filters
          </button>
        </div>
      )}
    </div>
  )
}
