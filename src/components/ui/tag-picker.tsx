'use client'

import { useMemo, useState } from 'react'
import { PREMADE_TAGS, premadeValue } from '@/lib/projectTags'

interface TagPickerProps {
  value: string[]
  onChange: (tags: string[]) => void
  max: number
  label?: string
}

const MAX_RESULTS = 30

// Hashtags come from the premade library only. Nothing is listed until the member starts typing,
// then matching tags appear (those that start with the text first). Tap a tag to add it; the
// chosen ones are shown above the box and can be removed with a tap.
export function TagPicker({ value, onChange, max, label = 'Hashtags' }: TagPickerProps) {
  const [query, setQuery] = useState('')
  const selected = useMemo(() => new Set(value.map((v) => v.toLowerCase())), [value])
  const full = value.length >= max
  const q = query.trim().replace(/^#+/, '').toLowerCase()

  const results = useMemo(() => {
    if (!q) return []
    const starts: string[] = []
    const contains: string[] = []
    for (const l of PREMADE_TAGS) {
      const v = premadeValue(l)
      if (selected.has(v.toLowerCase())) continue
      const lower = v.toLowerCase()
      if (lower.startsWith(q)) starts.push(v)
      else if (lower.includes(q)) contains.push(v)
    }
    return [...starts, ...contains].slice(0, MAX_RESULTS)
  }, [q, selected])

  const add = (tag: string) => {
    if (full || selected.has(tag.toLowerCase())) return
    onChange([...value, tag])
    setQuery('')
  }
  const remove = (tag: string) => onChange(value.filter((v) => v.toLowerCase() !== tag.toLowerCase()))

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <span className="text-xs text-gray-500">{value.length}/{max} selected</span>
      </div>

      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => remove(tag)}
              aria-label={`Remove #${tag}`}
              className="inline-flex items-center gap-1 rounded-full border border-indigo-600 bg-indigo-600 px-3 py-1 text-sm font-medium text-white"
            >
              #{tag}
              <span aria-hidden="true" className="text-indigo-200">×</span>
            </button>
          ))}
        </div>
      )}

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          // Enter must not submit the whole form; it adds the top match instead
          if (e.key === 'Enter') {
            e.preventDefault()
            if (results[0]) add(results[0])
          }
        }}
        disabled={full}
        placeholder={full ? `You can pick up to ${max}. Remove one to add another.` : 'Start typing, e.g. Director, Editor, Actor...'}
        className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:bg-gray-50"
        aria-label="Search hashtags"
        autoComplete="off"
      />

      {q && !full && (
        <div className="mt-2" aria-live="polite">
          {results.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {results.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => add(tag)}
                  className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 transition hover:border-indigo-400"
                >
                  #{tag}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No hashtag matches &ldquo;{query.trim()}&rdquo;. Try a shorter word.</p>
          )}
        </div>
      )}
    </div>
  )
}
