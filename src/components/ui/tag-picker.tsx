'use client'

import { useState } from 'react'
import { TAG_GROUPS, premadeValue } from '@/lib/projectTags'

interface TagPickerProps {
  value: string[]
  onChange: (tags: string[]) => void
  max: number
  label?: string
}

// Hashtags are picked from the premade list only: tap to select, tap again to remove.
export function TagPicker({ value, onChange, max, label = 'Hashtags' }: TagPickerProps) {
  const [query, setQuery] = useState('')
  const selected = new Set(value.map((v) => v.toLowerCase()))
  const full = value.length >= max
  const q = query.trim().toLowerCase()

  const toggle = (tagLabel: string) => {
    const tag = premadeValue(tagLabel)
    if (selected.has(tag.toLowerCase())) onChange(value.filter((v) => v.toLowerCase() !== tag.toLowerCase()))
    else if (!full) onChange([...value, tag])
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <span className="text-xs text-gray-500">{value.length}/{max} selected</span>
      </div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search tags..."
        className="mb-3 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        aria-label="Search tags"
      />
      <div className="space-y-3">
        {TAG_GROUPS.map((g) => {
          const labels = g.labels.filter((l) => !q || l.toLowerCase().includes(q))
          if (labels.length === 0) return null
          return (
            <div key={g.group}>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">{g.group}</p>
              <div className="flex flex-wrap gap-1.5">
                {labels.map((l) => {
                  const on = selected.has(premadeValue(l).toLowerCase())
                  return (
                    <button
                      key={l}
                      type="button"
                      onClick={() => toggle(l)}
                      aria-pressed={on}
                      disabled={!on && full}
                      className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
                        on ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 bg-white text-gray-700 hover:border-indigo-400 disabled:opacity-40'
                      }`}
                    >
                      #{premadeValue(l)}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
