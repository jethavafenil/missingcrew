'use client'

import { useMemo, useState } from 'react'
import { ImageCropperModal } from './ImageCropperModal'
import { LocationAutocomplete } from '@/components/ui/location-autocomplete'
import { MultiSelect } from '@/components/ui/multi-select'
import { departments } from '@/lib/departments'
import { PROJECT_TYPE_OPTIONS } from '@/lib/projectTypes'
import { MAX_PROFILE_LINKS, cleanLink } from '@/lib/crew/profileLinks'
import { COMPLETION_LABELS, type CompletionKey } from '@/lib/crew/completion'

export type MissingKey = CompletionKey | 'terms'

export interface MissingFormData {
  photo?: string
  city?: string
  primaryRoles?: string[]
  yearsExperience?: string
  availability?: boolean
  availableToTravel?: boolean
  availabilityStart?: string
  availabilityEnd?: string
  contactWhatsApp?: string
  imdbLink?: string
  portfolioLinks?: Array<{ url: string; title?: string } | string>
  projectTypes?: string[]
  termsAgreed?: boolean
}

interface Props {
  missing: MissingKey[]
  data: MissingFormData
  onChange: (patch: MissingFormData) => void
  showErrors: boolean
}

const EXPERIENCE_LEVELS = ['0-1 years', '1-3 years', '3-5 years', '5-10 years', '10+ years']
const input = 'block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500'
const yesNo = (on: boolean) =>
  `rounded-lg border px-4 py-2 text-sm font-medium ${on ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`

function Field({ title, hint, error, children }: { title: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-gray-800">{title}</p>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      {error && <p className="mt-1 text-sm text-red-600" role="alert">{error}</p>}
    </div>
  )
}

// "Complete your profile": only the items that are still empty, nothing the member already filled in.
export function MissingFieldsForm({ missing, data, onChange, showErrors }: Props) {
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [newLink, setNewLink] = useState('')
  const [linkError, setLinkError] = useState('')
  const roleOptions = useMemo(() => Array.from(new Set(departments.flatMap((d) => d.roles))).map((r) => ({ value: r })), [])
  const has = (k: MissingKey) => missing.includes(k)
  const links = data.portfolioLinks ?? []

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = e.currentTarget
    const file = el.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setCropSrc(ev.target?.result as string)
    reader.readAsDataURL(file)
    el.value = ''
  }

  const addLink = () => {
    const url = cleanLink(newLink)
    if (!url) {
      setLinkError('Enter a full web link, for example https://example.com/my-work')
      return
    }
    if (links.length >= MAX_PROFILE_LINKS) {
      setLinkError(`You can keep up to ${MAX_PROFILE_LINKS} links`)
      return
    }
    onChange({ portfolioLinks: [...links, url] })
    setNewLink('')
    setLinkError('')
  }

  return (
    <div className="space-y-6">
      {has('photo') && (
        <Field title="Profile photo *" error={showErrors && !data.photo ? 'A profile photo is required' : ''}>
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gray-200">
              {data.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.photo} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span className="text-gray-400">Photo</span>
              )}
            </div>
            <div>
              <input type="file" accept="image/*" onChange={onPhoto} className="hidden" id="missing-photo" />
              <label htmlFor="missing-photo" className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                {data.photo ? 'Change photo' : 'Upload photo'}
              </label>
            </div>
          </div>
        </Field>
      )}

      {has('city') && (
        <Field title="City *" error={showErrors && !(data.city || '').trim() ? 'Your city is required' : ''}>
          <LocationAutocomplete label="" value={data.city || ''} onChange={(v) => onChange({ city: v })} placeholder="Enter city..." className={input} />
        </Field>
      )}

      {has('roles') && (
        <Field title="Primary roles (up to 3) *" error={showErrors && !(data.primaryRoles && data.primaryRoles.length) ? 'Pick at least one role' : ''}>
          <MultiSelect label="Primary roles" options={roleOptions} value={data.primaryRoles ?? []} onChange={(v) => onChange({ primaryRoles: v.slice(0, 3) })} max={3} placeholder="Select your roles" />
        </Field>
      )}

      {has('experience') && (
        <Field title="Years of experience">
          <select value={data.yearsExperience || ''} onChange={(e) => onChange({ yearsExperience: e.target.value })} className={input}>
            <option value="">Select experience level</option>
            {EXPERIENCE_LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </Field>
      )}

      {has('availability') && (
        <Field title="Are you currently available for work?">
          <div className="flex gap-2">
            <button type="button" className={yesNo(data.availability === true)} onClick={() => onChange({ availability: true })}>Available</button>
            <button type="button" className={yesNo(data.availability === false)} onClick={() => onChange({ availability: false })}>Booked</button>
          </div>
        </Field>
      )}

      {has('travel') && (
        <Field title="Are you willing to travel?">
          <div className="flex gap-2">
            <button type="button" className={yesNo(data.availableToTravel === true)} onClick={() => onChange({ availableToTravel: true })}>Yes</button>
            <button type="button" className={yesNo(data.availableToTravel === false)} onClick={() => onChange({ availableToTravel: false })}>No</button>
          </div>
        </Field>
      )}

      {(has('availStart') || has('availEnd')) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {has('availStart') && (
            <Field title="Available from">
              <input type="date" value={data.availabilityStart || ''} onChange={(e) => onChange({ availabilityStart: e.target.value })} className={input} />
            </Field>
          )}
          {has('availEnd') && (
            <Field title="Available until">
              <input type="date" value={data.availabilityEnd || ''} onChange={(e) => onChange({ availabilityEnd: e.target.value })} className={input} />
            </Field>
          )}
        </div>
      )}

      {has('types') && (
        <Field title="Project types you work on">
          <MultiSelect label="Project types" options={PROJECT_TYPE_OPTIONS} value={data.projectTypes ?? []} onChange={(v) => onChange({ projectTypes: v })} placeholder="Select project types" />
        </Field>
      )}

      {has('whatsapp') && (
        <Field title="WhatsApp number" hint="Producers contact you on WhatsApp for quick communication.">
          <input type="tel" inputMode="tel" placeholder="+919876543210" value={data.contactWhatsApp || ''} onChange={(e) => onChange({ contactWhatsApp: e.target.value })} className={input} />
        </Field>
      )}

      {has('imdb') && (
        <Field title="IMDb profile link" hint="Optional. Format: https://www.imdb.com/name/nm0000129/">
          <input type="url" placeholder="https://www.imdb.com/name/nm0000129/" value={data.imdbLink || ''} onChange={(e) => onChange({ imdbLink: e.target.value })} className={input} />
        </Field>
      )}

      {has('links') && (
        <Field title="Add a portfolio link" error={linkError}>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://example.com/my-work"
              value={newLink}
              onChange={(e) => {
                setNewLink(e.target.value)
                setLinkError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addLink()
                }
              }}
              className={input}
            />
            <button type="button" onClick={addLink} className="shrink-0 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              Add
            </button>
          </div>
          {links.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-gray-700">
              {links.map((l, i) => (
                <li key={i} className="truncate">✓ {typeof l === 'string' ? l : l.url}</li>
              ))}
            </ul>
          )}
        </Field>
      )}

      {has('terms') && (
        <Field title="Terms" error={showErrors && !data.termsAgreed ? 'Please accept the Terms and Privacy Policy to finish' : ''}>
          <label className="flex items-start gap-3 text-sm text-gray-700">
            <input type="checkbox" checked={!!data.termsAgreed} onChange={(e) => onChange({ termsAgreed: e.target.checked })} className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600" />
            <span>
              I agree to the{' '}
              <a href="/terms" target="_blank" className="text-indigo-600 hover:underline">Terms and Conditions</a> and{' '}
              <a href="/privacy" target="_blank" className="text-indigo-600 hover:underline">Privacy Policy</a>. I confirm that all information provided is accurate.
            </span>
          </label>
        </Field>
      )}

      {cropSrc && (
        <ImageCropperModal
          src={cropSrc}
          aspect={1}
          onCancel={() => setCropSrc(null)}
          onCrop={(dataUrl) => {
            onChange({ photo: dataUrl })
            setCropSrc(null)
          }}
        />
      )}
    </div>
  )
}

export { COMPLETION_LABELS }
