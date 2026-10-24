'use client'

import { useState } from 'react'
import { Gift, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buildReferralLink } from '@/lib/referral'

// Crew share their personal link; when a friend signs up through it and completes their
// profile, the crew member gets 2 more months of free access.
export function ReferralCard({ crewProfileId }: { crewProfileId: string }) {
  const [copied, setCopied] = useState(false)
  const link = buildReferralLink(typeof window !== 'undefined' ? window.location.origin : 'https://missingcrew.vercel.app', crewProfileId)
  const text = `Join me on MissingCrew, where film crew and producers find each other: ${link}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy your referral link:', link)
    }
  }

  return (
    <div className="rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 p-4 sm:p-5">
      <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
        <Gift className="h-5 w-5 text-purple-600" /> Invite friends, get 2 months free
      </h3>
      <p className="mt-1 text-sm text-gray-600">Share your link. When someone joins with it and completes their profile, you get 2 more months of free access.</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700" aria-label="Your referral link" />
        <div className="flex gap-2">
          <Button type="button" onClick={copy} variant="outline" className="flex-1 sm:flex-none">
            {copied ? <Check className="mr-1 h-4 w-4 text-green-600" /> : <Copy className="mr-1 h-4 w-4" />} {copied ? 'Copied' : 'Copy'}
          </Button>
          <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" className="inline-flex flex-1 items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 sm:flex-none">
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
