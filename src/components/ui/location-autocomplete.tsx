'use client'

import { publicEnv } from '@/lib/public-env'

import { useState, useRef, useEffect } from 'react'

interface LocationAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  label?: string
}

interface LocationIQSuggestion {
  place_id: string
  display_name: string
  lat: string
  lon: string
  type: string
}

export function LocationAutocomplete({
  value,
  onChange,
  placeholder = "Enter city, country...",
  className = "",
  label
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<LocationIQSuggestion[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Cancel any in-flight request and pending debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      abortControllerRef.current?.abort()
    }
  }, [])

  // Handle location search using LocationIQ Autocomplete API
  const handleLocationSearch = (input: string) => {
    if (!input.trim()) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    const apiKey = publicEnv.NEXT_PUBLIC_LOCATIONIQ_API_KEY
    if (!apiKey) return // key not configured — no suggestions

    // Debounce: LocationIQ's free tier allows ~2 req/sec, and firing on
    // every keystroke triggers 429s.
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void fetchSuggestions(input, apiKey)
    }, 300)
  }

  const fetchSuggestions = async (input: string, apiKey: string) => {
    // Abort previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    try {
      setIsLoading(true)
      abortControllerRef.current = new AbortController()

      // LocationIQ Autocomplete API
      const response = await fetch(
        `https://api.locationiq.com/v1/autocomplete?` +
        `key=${apiKey}&` +
        `q=${encodeURIComponent(input)}&` +
        `limit=5&` +
        `format=json&` +
        `tag=place:city,place:town,place:village`, // Focus on cities
        { signal: abortControllerRef.current.signal }
      )

      if (!response.ok) {
        // Transient API errors (rate limit, invalid key) — show nothing
        // rather than throwing a console error per keystroke.
        if (response.status !== 429) {
          console.error('LocationIQ request failed with status:', response.status)
        }
        setSuggestions([])
        setShowDropdown(false)
        return
      }

      const data = await response.json()
      if (Array.isArray(data)) {
        // Remove duplicates based on place_id and display_name
        const uniqueSuggestions = data.filter((suggestion, index, self) =>
          index === self.findIndex(s =>
            s.place_id === suggestion.place_id ||
            cleanDisplayName(s.display_name).toLowerCase() === cleanDisplayName(suggestion.display_name).toLowerCase()
          )
        )
        setSuggestions(uniqueSuggestions)
        setShowDropdown(uniqueSuggestions.length > 0)
      } else {
        setSuggestions([])
        setShowDropdown(false)
      }
    } catch (error: unknown) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error fetching location suggestions:', error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Clean up location display name (remove duplicates like "Delhi, Delhi, Delhi")
  const cleanDisplayName = (displayName: string): string => {
    const parts = displayName.split(', ')
    const uniqueParts: string[] = []
    const seen = new Set<string>()
    
    for (const part of parts) {
      const normalized = part.trim().toLowerCase()
      if (!seen.has(normalized)) {
        seen.add(normalized)
        uniqueParts.push(part.trim())
      }
    }
    
    return uniqueParts.join(', ')
  }

  // Handle location selection
  const handleLocationSelect = (displayName: string) => {
    const cleaned = cleanDisplayName(displayName)
    onChange(cleaned)
    setSuggestions([])
    setShowDropdown(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          handleLocationSearch(e.target.value)
        }}
        onFocus={() => {
          if (value && suggestions.length > 0) {
            setShowDropdown(true)
          }
        }}
        placeholder={placeholder}
        className={className}
      />
      
      {/* Location Dropdown */}
      {showDropdown && (suggestions.length > 0 || isLoading) && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              Loading...
            </div>
          ) : (
            suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.place_id}-${index}`}
                type="button"
                onClick={() => handleLocationSelect(suggestion.display_name)}
                className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-gray-700 flex items-start text-sm"
              >
                <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{cleanDisplayName(suggestion.display_name)}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
