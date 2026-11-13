'use client'

import { useState, useRef, useEffect } from 'react'
import { cleanDisplayName, type LocationSuggestion } from '@/lib/locations'

interface LocationAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  label?: string
}

type SearchState = 'idle' | 'searching' | 'done' | 'failed'

// Answers already fetched in this browser tab, so retyping or backspacing is instant.
const answered = new Map<string, LocationSuggestion[]>()
const CACHE_LIMIT = 60

function remember(query: string, list: LocationSuggestion[]) {
  if (answered.size >= CACHE_LIMIT) answered.delete(answered.keys().next().value as string)
  answered.set(query, list)
}

export function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'Enter city, country...',
  className = '',
  label,
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [state, setState] = useState<SearchState>('idle')
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const close = (e: MouseEvent | TouchEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('touchstart', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('touchstart', close)
      document.removeEventListener('keydown', esc)
    }
  }, [])

  // Cancel any in-flight request and pending debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      abortRef.current?.abort()
    }
  }, [])

  const fetchSuggestions = async (query: string) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const response = await fetch(`/api/locations?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      if (!response.ok) throw new Error(`status ${response.status}`)
      const data = await response.json()
      if (data?.error) throw new Error(String(data.error))
      const list: LocationSuggestion[] = Array.isArray(data?.suggestions) ? data.suggestions : []
      if (data?.configured !== false) remember(query.toLowerCase(), list)
      if (abortRef.current !== controller) return
      setSuggestions(list)
      setState('done')
    } catch (error: unknown) {
      if ((error as Error).name === 'AbortError') return
      if (abortRef.current !== controller) return
      setSuggestions([])
      setState('failed')
    }
  }

  // Suggestions come from /api/locations (LocationIQ behind our server, key stays private).
  // The "Searching..." row shows right away; the request follows after a short pause in typing.
  const search = (input: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const query = input.trim()
    if (query.length < 2) {
      abortRef.current?.abort()
      setSuggestions([])
      setState('idle')
      setOpen(false)
      return
    }
    setOpen(true)
    const cached = answered.get(query.toLowerCase())
    if (cached) {
      abortRef.current?.abort()
      setSuggestions(cached)
      setState('done')
      return
    }
    setState('searching')
    debounceRef.current = setTimeout(() => void fetchSuggestions(query), 250)
  }

  const select = (displayName: string) => {
    onChange(cleanDisplayName(displayName))
    setSuggestions([])
    setState('idle')
    setOpen(false)
  }

  const searching = state === 'searching'

  return (
    <div className="relative" ref={boxRef}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <input
        type="text"
        value={value}
        autoComplete="off"
        aria-busy={searching}
        aria-autocomplete="list"
        onChange={(e) => {
          onChange(e.target.value)
          search(e.target.value)
        }}
        onFocus={() => {
          if (state !== 'idle' && value.trim().length >= 2) setOpen(true)
        }}
        placeholder={placeholder}
        className={className}
      />

      {/* Spinner inside the box while places are being searched */}
      {searching && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" aria-hidden="true">
          <svg className="h-4 w-4 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </span>
      )}

      {open && state !== 'idle' && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg" role="listbox">
          {searching && (
            <div className="flex items-center justify-center gap-2 px-4 py-3 text-sm text-gray-500" role="status">
              <svg className="h-4 w-4 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Searching places...
            </div>
          )}

          {state === 'done' &&
            suggestions.map((s, index) => (
              <button
                key={`${s.place_id}-${index}`}
                type="button"
                role="option"
                aria-selected="false"
                onClick={() => select(s.display_name)}
                className="flex w-full items-start px-4 py-2 text-left text-sm text-gray-700 hover:bg-indigo-50"
              >
                <svg className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{cleanDisplayName(s.display_name)}</span>
              </button>
            ))}

          {state === 'done' && suggestions.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500">No matching place found. You can keep what you typed.</div>
          )}
          {state === 'failed' && (
            <div className="px-4 py-3 text-sm text-gray-500">Could not load suggestions right now. You can type the place yourself.</div>
          )}
        </div>
      )}
    </div>
  )
}
