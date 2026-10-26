'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

interface MultiSelectProps {
  label: string
  options: Array<{ value: string; label?: string; group?: string }>
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  searchable?: boolean
}

// Dropdown with checkboxes that stays open while you tick several options (fewer clicks).
export function MultiSelect({ label, options, value, onChange, placeholder = 'Any', searchable = true }: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | TouchEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
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
  }, [open])

  const q = query.trim().toLowerCase()
  const shown = useMemo(() => options.filter((o) => !q || (o.label ?? o.value).toLowerCase().includes(q)), [options, q])
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={label}
        className="flex w-full items-center justify-between rounded-lg border-2 border-gray-300 bg-white px-3 py-2.5 text-left text-sm hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <span className={value.length ? 'font-medium text-gray-900' : 'text-gray-500'}>
          {value.length === 0 ? placeholder : value.length === 1 ? (options.find((o) => o.value === value[0])?.label ?? value[0]) : `${value.length} selected`}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-gray-500 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full min-w-[220px] rounded-lg border border-gray-200 bg-white shadow-xl">
          {searchable && (
            <div className="border-b border-gray-100 p-2">
              <input
                autoFocus
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}...`}
                className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm"
              />
            </div>
          )}
          <ul className="max-h-60 overflow-y-auto py-1" role="listbox" aria-multiselectable="true">
            {shown.length === 0 && <li className="px-3 py-2 text-sm text-gray-500">Nothing found</li>}
            {shown.map((o) => {
              const on = value.includes(o.value)
              return (
                <li key={o.value} role="option" aria-selected={on}>
                  <button
                    type="button"
                    onClick={() => toggle(o.value)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-indigo-50 ${on ? 'bg-indigo-50/60 font-medium text-indigo-900' : 'text-gray-700'}`}
                  >
                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${on ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'}`}>
                      {on && <Check className="h-3 w-3 text-white" />}
                    </span>
                    {o.label ?? o.value}
                  </button>
                </li>
              )
            })}
          </ul>
          {value.length > 0 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-3 py-2">
              <button type="button" onClick={() => onChange([])} className="text-xs font-medium text-gray-500 hover:text-red-600">
                Clear
              </button>
              <button type="button" onClick={() => setOpen(false)} className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700">
                Done
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
