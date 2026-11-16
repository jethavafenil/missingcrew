'use client'

import { useState } from 'react'
import { ImageCropperModal } from './ImageCropperModal'
import { LocationAutocomplete } from '@/components/ui/location-autocomplete'
import { MOBILE_LENGTH, sanitizeMobileInput } from '@/lib/phone'

interface BasicInfoData {
  photo: string
  name: string
  phone: string
  city: string
  phoneVerified?: boolean
}

interface BasicInfoStepProps {
  data: Partial<BasicInfoData>
  onChange: (data: Partial<BasicInfoData>) => void
  // set once the member tried to continue: required fields that are still empty are marked
  showErrors?: boolean
}

const fieldBase = 'block w-full border rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500'
const ok = 'border-gray-300'
const bad = 'border-red-500'

export function BasicInfoStep({ data, onChange, showErrors = false }: BasicInfoStepProps) {
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const photo = data.photo || ''
  const phone = data.phone || ''

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => setCropSrc(e.target?.result as string)
    reader.readAsDataURL(file)
    // reset the input synchronously to avoid React's event pooling nulling it
    input.value = ''
  }

  const phoneTooShort = phone.length > 0 && phone.length < MOBILE_LENGTH
  const phoneError = phoneTooShort ? `Enter all ${MOBILE_LENGTH} digits (${phone.length} so far)` : showErrors && phone.length === 0 ? 'Mobile number is required' : ''
  const photoError = showErrors && !photo ? 'A profile photo is required' : ''
  const nameError = showErrors && !(data.name || '').trim() ? 'Your name is required' : ''
  const cityError = showErrors && !(data.city || '').trim() ? 'Your city is required' : ''

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Basic Information</h2>
      <p className="text-sm text-gray-600">
        A photo, your mobile number and your city are required. Producers only see applications from complete profiles.
      </p>

      {/* Photo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Profile Photo <span className="text-red-600">*</span>
        </label>
        <div className="flex items-center space-x-4">
          <div className={`w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden ring-2 ${photoError ? 'ring-red-500' : 'ring-transparent'}`}>
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-400">Photo</span>
            )}
          </div>
          <div>
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" id="photo-upload" />
            <label
              htmlFor="photo-upload"
              className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {photo ? 'Change Photo' : 'Upload Photo'}
            </label>
          </div>
        </div>
        {photoError && <p className="mt-1 text-sm text-red-600" role="alert">{photoError}</p>}
      </div>

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Full Name <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          id="name"
          value={data.name || ''}
          onChange={(e) => onChange({ name: e.target.value })}
          aria-invalid={!!nameError}
          className={`mt-1 ${fieldBase} ${nameError ? bad : ok}`}
          required
        />
        {nameError && <p className="mt-1 text-sm text-red-600" role="alert">{nameError}</p>}
      </div>

      {/* Mobile number: exactly 10 digits */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Mobile Number <span className="text-red-600">*</span>
        </label>
        <div className="mt-1 flex">
          <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-600" aria-hidden="true">
            +91
          </span>
          <input
            type="tel"
            id="phone"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="10-digit number"
            maxLength={MOBILE_LENGTH + 8}
            value={phone}
            onChange={(e) => onChange({ phone: sanitizeMobileInput(e.target.value) })}
            aria-invalid={!!phoneError}
            aria-describedby={phoneError ? 'phone-error' : undefined}
            className={`block w-full rounded-r-md border p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${phoneError ? bad : ok}`}
            required
          />
        </div>
        {phoneError && <p id="phone-error" className="mt-1 text-sm text-red-600" role="alert">{phoneError}</p>}
      </div>

      {/* City */}
      <div>
        <LocationAutocomplete
          label="City *"
          value={data.city || ''}
          onChange={(value) => onChange({ city: value })}
          placeholder="Enter city..."
          className={`mt-1 ${fieldBase} ${cityError ? bad : ok}`}
        />
        {cityError && <p className="mt-1 text-sm text-red-600" role="alert">{cityError}</p>}
      </div>

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
