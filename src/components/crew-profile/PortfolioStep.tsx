'use client'

import { useMemo, useState } from 'react'
import { departments } from '@/lib/departments'

interface PastProject {
  title: string
  year: string
  role: string
  link?: string
}

interface PortfolioData {
  portfolioLinks: Array<{url: string, title?: string} | string>
  imdbLink: string
  languages: string[]
  pastProjects: PastProject[]
}

interface PortfolioStepProps {
  data: Partial<PortfolioData>
  onChange: (data: Partial<PortfolioData>) => void
}

// Lightweight searchable role component
function RoleSearch({ value, onSelect }: { value: string; onSelect: (role: string) => void }) {
  const roles = useMemo(() => Array.from(new Set(departments.flatMap(d => d.roles))), [])
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return roles
    return roles.filter(r => r.toLowerCase().includes(query))
  }, [roles, q])

  const handleSelect = (role: string) => {
    onSelect(role)
    setOpen(false)
    setQ('')
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={q || value}
        onChange={(e) => { setQ(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Search role..."
        className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
      />
      {open && (
        <div className="absolute z-10 mt-1 w-full max-h-56 overflow-auto bg-white border rounded-md shadow-md">
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">No roles found</div>
          )}
          {filtered.slice(0, 100).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => handleSelect(role)}
              className="w-full text-left px-3 py-2 hover:bg-gray-50"
            >
              {role}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function PortfolioStep({ data, onChange }: PortfolioStepProps) {
  // Convert portfolioLinks to a consistent format (array of strings)
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>(() => {
    if (!data.portfolioLinks) return []

    return data.portfolioLinks.map(link => {
      if (typeof link === 'object' && link !== null) {
        return link.url || ''
      }
      return link
    }).filter(link => link !== '')
  })

  const [newLink, setNewLink] = useState('')

  const addPortfolioLink = () => {
    if (newLink.trim() && !portfolioLinks.includes(newLink.trim())) {
      const updatedLinks = [...portfolioLinks, newLink.trim()]
      setPortfolioLinks(updatedLinks)
      onChange({ portfolioLinks: updatedLinks })
      setNewLink('')
    }
  }

  const removePortfolioLink = (linkToRemove: string) => {
    const updatedLinks = portfolioLinks.filter(link => link !== linkToRemove)
    setPortfolioLinks(updatedLinks)
    onChange({ portfolioLinks: updatedLinks })
  }

  const updatePastProject = (index: number, field: keyof PastProject, value: string) => {
    const currentProjects = data.pastProjects || []
    const updatedProjects = [...currentProjects]

    if (!updatedProjects[index]) {
      updatedProjects[index] = { title: '', year: '', role: '', link: '' }
    }

    updatedProjects[index] = {
      ...updatedProjects[index],
      [field]: value
    }

    // Filter out empty projects
    const filteredProjects = updatedProjects.filter(project =>
      project.title || project.year || project.role || project.link
    )

    onChange({ pastProjects: filteredProjects })
  }

  // Languages searchable multi-select (Indian languages)
  const allLanguages = useMemo(() => [
    'Hindi','English','Bengali','Marathi','Telugu','Tamil','Gujarati','Urdu','Kannada','Odia','Malayalam','Punjabi','Assamese','Maithili','Sanskrit','Konkani','Dogri','Kashmiri','Nepali','Sindhi','Bodo','Manipuri (Meitei)','Santali','Kokborok (Tripuri)','Mizo','Khasi','Garo','Tulu','Bhojpuri','Magahi','Awadhi','Rajasthani','Haryanvi','Chhattisgarhi','Garhwali','Kumaoni','Ladakhi','Bhili','Gondi','Ho','Kui','Kurukh (Oraon)','Tamang','Sherpa','Angika','Sikkimese (Bhutia)','Lepcha','Nicobarese','Andamanese'
  ], [])
  const selLanguages = data.languages || []
  const [langQuery, setLangQuery] = useState('')
  const filteredLanguages = useMemo(() => {
    const q = langQuery.trim().toLowerCase()
    if (!q) return allLanguages
    return allLanguages.filter(l => l.toLowerCase().includes(q))
  }, [allLanguages, langQuery])

  const addLanguage = (language: string) => {
    if (selLanguages.includes(language)) return
    onChange({ languages: [...selLanguages, language] })
    setLangQuery('')
  }
  const removeLanguage = (language: string) => {
    onChange({ languages: selLanguages.filter(l => l !== language) })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Portfolio & Links</h2>

      {/* Languages Spoken */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Languages Spoken *
        </label>
        <div className="space-y-2">
          {/* Selected chips */}
          {selLanguages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selLanguages.map(language => (
                <span key={language} className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-3 py-1 text-sm">
                  {language}
                  <button type="button" className="text-indigo-700/80 hover:text-indigo-900" onClick={() => removeLanguage(language)} aria-label={`Remove ${language}`}>
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
              value={langQuery}
              onChange={(e) => setLangQuery(e.target.value)}
              placeholder={'Search languages...'}
              className={`w-full border rounded-md p-2 pr-8 focus:ring-indigo-500 focus:border-indigo-500`}
            />
            {langQuery && (
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setLangQuery('')} aria-label="Clear">
                ×
              </button>
            )}
          </div>

          {/* Results dropdown */}
          {filteredLanguages.length > 0 && (
            <div className="max-h-56 overflow-auto border rounded-md divide-y">
              {filteredLanguages.slice(0, 100).map((language) => (
                <button
                  key={language}
                  type="button"
                  onClick={() => addLanguage(language)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 disabled:opacity-50"
                  disabled={selLanguages.includes(language)}
                >
                  <div className="flex items-center justify-between">
                    <span>{language}</span>
                    {selLanguages.includes(language) && <span className="text-xs text-indigo-600">Selected</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500">Add all languages you can speak. Search to quickly find your languages.</p>
        </div>
      </div>

      {/* IMDb Link */}
      <div>
        <label htmlFor="imdbLink" className="block text-sm font-medium text-gray-700">
          IMDb Profile Link
        </label>
        {(() => {
          // Same normalization as the server (api/crew/profile): accept
          // http, no-www or m.imdb.com, and a missing trailing slash.
          const normalizeImdb = (value: string) => value
            .replace(/^http:\/\//i, 'https://')
            .replace(/\/+$/, '')
            .replace(/^https:\/\/(?:www\.|m\.)?imdb\.com\//i, 'https://www.imdb.com/')
          const value = (data.imdbLink || '').trim()
          const isInvalid = value !== '' && !/^https:\/\/www\.imdb\.com\/name\/nm\d{7,8}$/.test(normalizeImdb(value))
          return (
            <>
              <input
                type="url"
                id="imdbLink"
                placeholder="https://www.imdb.com/name/nm0000129/"
                value={data.imdbLink || ''}
                onChange={(e) => onChange({ imdbLink: e.target.value })}
                aria-invalid={isInvalid}
                aria-describedby="imdbLink-help"
                className={`mt-1 block w-full border rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  isInvalid ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <p id="imdbLink-help" className={`mt-1 text-sm ${isInvalid ? 'text-red-600' : 'text-gray-500'}`}>
                {isInvalid
                  ? 'Please enter a valid IMDb profile link in the format https://www.imdb.com/name/nm0000129/'
                  : 'Optional - share your IMDb profile'}
              </p>
            </>
          )
        })()}
      </div>

      {/* Portfolio Links */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Portfolio Links *
        </label>
        
        {/* Add New Link */}
        <div className="flex space-x-2 mb-4">
          <input
            type="url"
            placeholder="https://vimeo.com/your-profile or https://yourportfolio.com"
            value={newLink}
            onChange={(e) => setNewLink(e.target.value)}
            className="flex-1 border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={portfolioLinks.length >= 5}
          />
          <button
            type="button"
            onClick={addPortfolioLink}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={portfolioLinks.length >= 5}
          >
            Add
          </button>
        </div>

        {/* Portfolio Links List */}
        <div className="space-y-2">
          {portfolioLinks.map((link, index) => (
            <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <span className="text-sm text-gray-700 truncate">{link}</span>
              <button
                type="button"
                onClick={() => removePortfolioLink(link)}
                className="text-red-600 hover:text-red-800 ml-2"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {portfolioLinks.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            Add links to your portfolio, showreel, or social media profiles
          </p>
        )}

        <p className="mt-2 text-sm text-gray-500">
          Add links to your Vimeo, YouTube, Instagram, personal website, etc.
        </p>
      </div>

      {/* Past Projects */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Past Projects (Up to 3)
        </label>
        
        {[0, 1, 2].map(index => (
          <div key={index} className="space-y-3 mb-4 p-4 border rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Project Title</label>
                <input
                  type="text"
                  placeholder="Project Name"
                  value={data.pastProjects?.[index]?.title || ''}
                  onChange={(e) => updatePastProject(index, 'title', e.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Year</label>
                <input
                  type="number"
                  placeholder="2023"
                  min="2000"
                  max="2025"
                  value={data.pastProjects?.[index]?.year || ''}
                  onChange={(e) => updatePastProject(index, 'year', e.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Your Role</label>
                {/* Searchable role selector using roles from departments */}
                <RoleSearch
                  value={data.pastProjects?.[index]?.role || ''}
                  onSelect={(role) => updatePastProject(index, 'role', role)}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Project Link (Optional)</label>
              <input
                type="url"
                placeholder="https://www.imdb.com/title/... or portfolio link"
                value={data.pastProjects?.[index]?.link || ''}
                onChange={(e) => updatePastProject(index, 'link', e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        ))}
        
        <p className="text-sm text-gray-500">
          Showcase your best work to impress employers
        </p>
      </div>
    </div>
  )
}
