'use client'

import { LocationAutocomplete } from '@/components/ui/location-autocomplete'

interface ProfessionalDetailsData {
  primaryRoles: string[]
  yearsExperience: string
  location: string
  availableToTravel: boolean
}

interface ProfessionalDetailsStepProps {
  data: Partial<ProfessionalDetailsData>
  onChange: (data: Partial<ProfessionalDetailsData>) => void
}

import { departments } from '@/lib/departments'
import { useMemo, useState } from 'react'

const EXPERIENCE_LEVELS = [
 '0-1 years',
 '1-3 years',
 '3-5 years',
 '5-10 years',
 '10+ years'
]

export function ProfessionalDetailsStep({ data, onChange }: ProfessionalDetailsStepProps) {
 const [query, setQuery] = useState('')
 const selected = data.primaryRoles || []
 const allRoles = useMemo(() => departments.flatMap(d => d.roles), [])
 const filtered = useMemo(() => {
   const q = query.trim().toLowerCase()
   if (!q) return allRoles
   return allRoles.filter(r => r.toLowerCase().includes(q))
 }, [allRoles, query])

 const addRole = (role: string) => {
   if (selected.includes(role)) return
   if (selected.length >= 3) return
   onChange({ primaryRoles: [...selected, role] })
   setQuery('')
 }
 const removeRole = (role: string) => {
   onChange({ primaryRoles: selected.filter(r => r !== role) })
 }

 return (
   <div className="space-y-6">
     <h2 className="text-xl font-semibold">Professional Details</h2>

     {/* Primary Roles - searchable multi-select (up to 3) */}
     <div>
       <label className="block text-sm font-medium text-gray-700 mb-2">
         Primary Roles (Select up to 3) *
       </label>
       <div className="space-y-2">
         {/* Selected chips */}
         {selected.length > 0 && (
           <div className="flex flex-wrap gap-2">
             {selected.map(role => (
               <span key={role} className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-3 py-1 text-sm">
                 {role}
                 <button type="button" className="text-indigo-700/80 hover:text-indigo-900" onClick={() => removeRole(role)} aria-label={`Remove ${role}`}>
                   ×
                 </button>
               </span>
             ))}
           </div>
         )}

         {/* Search input */}
         <div className="relative">
           <input
             type="text"
             value={query}
             onChange={(e) => setQuery(e.target.value)}
             placeholder={selected.length >= 3 ? 'Limit reached (3)' : 'Search roles...'}
             disabled={selected.length >= 3}
             className={`w-full border rounded-md p-2 pr-8 focus:ring-indigo-500 focus:border-indigo-500 ${selected.length >= 3 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
           />
           {query && (
             <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setQuery('')} aria-label="Clear">
               ×
             </button>
           )}
         </div>

         {/* Results dropdown */}
         {query && filtered.length > 0 && selected.length < 3 && (
           <div className="max-h-56 overflow-auto border rounded-md divide-y">
             {filtered.slice(0, 50).map((role) => (
               <button
                 key={role}
                 type="button"
                 onClick={() => addRole(role)}
                 className="w-full text-left px-3 py-2 hover:bg-gray-50 disabled:opacity-50"
                 disabled={selected.includes(role)}
               >
                 <div className="flex items-center justify-between">
                   <span>{role}</span>
                   {selected.includes(role) && <span className="text-xs text-indigo-600">Selected</span>}
                 </div>
               </button>
             ))}
             {filtered.length > 50 && (
               <div className="px-3 py-2 text-xs text-gray-500">Showing first 50 results. Narrow your search.</div>
             )}
           </div>
         )}

         {/* Helper text */}
         <p className="text-xs text-gray-500">Choose up to 3 roles. Start typing to search across all departments.</p>
       </div>
     </div>

     {/* Years of Experience */}
     <div>
       <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
         Years of Experience *
       </label>
       <select
         id="experience"
         value={data.yearsExperience || ''}
         onChange={(e) => onChange({ yearsExperience: e.target.value })}
         className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
       >
         <option value="">Select experience level</option>
         {EXPERIENCE_LEVELS.map((level) => (
           <option key={level} value={level}>{level}</option>
         ))}
       </select>
     </div>

     {/* Location */}
     <div>
       <LocationAutocomplete
         label="Preferred Location *"
         value={data.location || ''}
         onChange={(value) => onChange({ location: value })}
         placeholder="Enter city, country..."
         className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
       />
     </div>

   </div>
 )
}
