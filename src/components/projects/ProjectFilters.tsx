'use client'

import { useMemo } from 'react'
import { LocationAutocomplete } from '@/components/ui/location-autocomplete'
import { MultiSelect } from '@/components/ui/multi-select'
import { departments } from '@/lib/departments'
import { PROJECT_TYPES } from '@/lib/projectTypes'
import { PREMADE_TAGS, premadeValue } from '@/lib/projectTags'
import { EMPTY_PROJECT_FILTERS, type ProjectFilterState } from '@/lib/projectFilters'
import { toggleIn } from '@/lib/crewFilters'

interface ProjectFiltersProps {
  filters: ProjectFilterState
  onFiltersChange: (filters: ProjectFilterState) => void
  compact?: boolean
  showAdvanced?: boolean
}

const DATE_RANGES = [
  { value: '', label: 'Any time' },
  { value: 'this_week', label: 'This week' },
  { value: 'next_week', label: 'Next week' },
  { value: 'this_month', label: 'This month' },
  { value: 'next_month', label: 'Next month' },
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

// Roles, project types and hashtags are multi-select; everything applies as soon as it changes.
export function ProjectFilters({ filters, onFiltersChange, compact = false }: ProjectFiltersProps) {
  const set = <K extends keyof ProjectFilterState>(key: K, value: ProjectFilterState[K]) => onFiltersChange({ ...filters, [key]: value })

  const roleOptions = useMemo(() => Array.from(new Set(departments.flatMap((d) => d.roles))).map((r) => ({ value: r })), [])
  const tagOptions = useMemo(() => PREMADE_TAGS.map((t) => ({ value: premadeValue(t), label: `#${premadeValue(t)}` })), [])

  return (
    <div className={compact ? 'space-y-3' : 'mb-6 space-y-3 rounded-xl border border-gray-200 bg-white/90 p-5 shadow-sm backdrop-blur-sm'}>
      {!compact && (
        <div className="border-b border-gray-200 pb-3">
          <h3 className="text-xl font-bold text-gray-900">Project Filters</h3>
          <p className="text-sm text-gray-600">Tick several options in a list to see all of them</p>
        </div>
      )}

      <div className={compact ? 'space-y-3' : 'grid grid-cols-1 gap-3 md:grid-cols-2'}>
        <div className={box}>
          <span className={labelClass}>🎬 Roles needed</span>
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
          <span className={labelClass}>📅 Shoot date</span>
          <div className="flex flex-wrap gap-1.5">
            {DATE_RANGES.map((d) => (
              <Chip key={d.value} on={filters.dateRange === d.value} onClick={() => set('dateRange', d.value)}>
                {d.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className={`${box} md:col-span-2`}>
          <span className={labelClass}>📍 Location</span>
          <LocationAutocomplete label="" value={filters.location} onChange={(v) => set('location', v)} placeholder="City or state" className={input} />
        </div>
      </div>

      {!compact && (
        <div className="border-t border-gray-200 pt-4">
          <button type="button" onClick={() => onFiltersChange({ ...EMPTY_PROJECT_FILTERS })} className="rounded-lg bg-gray-100 px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-200">
            Clear all filters
          </button>
        </div>
      )}
    </div>
  )
}
