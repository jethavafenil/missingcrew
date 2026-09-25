'use client'

import { useState } from 'react'
import { ImageCropperModal } from './ImageCropperModal'
import { LocationAutocomplete } from '@/components/ui/location-autocomplete'

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
}

export function BasicInfoStep({ data, onChange }: BasicInfoStepProps) {
  const [photo, setPhoto] = useState(data.photo || '')
  const [cropSrc, setCropSrc] = useState<string | null>(null)

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const src = e.target?.result as string
      setCropSrc(src)
    }
    reader.readAsDataURL(file)
    // reset the input synchronously to avoid React's event pooling nulling it
    input.value = ''
  }

  const handleCropCancel = () => {
    setCropSrc(null)
  }

  const handleCropConfirm = (dataUrl: string) => {
    setPhoto(dataUrl)
    onChange({ photo: dataUrl })
    setCropSrc(null)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Basic Information</h2>
      
      {/* Photo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Profile Photo
        </label>
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
            {photo ? (
              <img src={photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-400">Photo</span>
            )}
          </div>
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Upload Photo
            </label>
          </div>
        </div>
      </div>

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Full Name *
        </label>
        <input
          type="text"
          id="name"
          value={data.name || ''}
          onChange={(e) => onChange({ name: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Phone Number (with country code) *
        </label>
        <input
          type="tel"
          id="phone"
          placeholder="e.g., +919876543210"
          value={data.phone || ''}
          onChange={(e) => onChange({ phone: e.target.value })}
          pattern="^\\+[1-9]\\d{1,14}$"
          title="Enter phone number in E.164 format, e.g., +14155552671"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
        <p className="mt-1 text-xs text-gray-500">Include country code, e.g., +91 for India</p>
      </div>

      {/* City */}
      <div>
        <LocationAutocomplete
          label="City *"
          value={data.city || ''}
          onChange={(value) => onChange({ city: value })}
          placeholder="Enter city..."
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {cropSrc && (
        <ImageCropperModal
          src={cropSrc}
          aspect={1}
          onCancel={handleCropCancel}
          onCrop={handleCropConfirm}
        />
      )}
    </div>
  )
}
