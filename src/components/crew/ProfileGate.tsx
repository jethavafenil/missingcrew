'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { GAP_LABELS, type ProfileGap } from '@/lib/crew/readiness'
import { swrFetcher } from '@/lib/swr'
import type { ProfileLink } from '@/lib/crew/profileLinks'

export interface Readiness {
  hasProfile: boolean
  core: ProfileGap[]
  full: ProfileGap[]
  links: ProfileLink[]
}

// What the signed-in crew member still has to add. Asked fresh every time a dialog opens, and again
// when the tab regains focus (they come back from the profile page).
export function useCrewReadiness(enabled = true) {
  const { data, error, isLoading } = useSWR<Readiness>(enabled ? '/api/crew/readiness' : null, swrFetcher, {
    revalidateOnMount: true,
    revalidateOnFocus: true,
    dedupingInterval: 0,
    shouldRetryOnError: false,
  })
  return { readiness: data, loading: isLoading, failed: !!error }
}

export function profileSetupHref(): string {
  const back = typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : ''
  return back ? `/crew/profile-setup?returnUrl=${encodeURIComponent(back)}` : '/crew/profile-setup'
}

// "Before you continue: add a profile photo, add your mobile number..." with a button to the profile.
export function ProfileGate({ gaps, title, text }: { gaps: ProfileGap[]; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900" role="alert">
      <p className="flex items-center gap-2 font-semibold">
        <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
        {title}
      </p>
      <p className="mt-1 text-sm">{text}</p>
      <ul className="mt-3 space-y-1.5 text-sm">
        {gaps.map((g) => (
          <li key={g} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
            {GAP_LABELS[g]}
          </li>
        ))}
      </ul>
      <Link
        href={profileSetupHref()}
        className="mt-4 inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        Complete my profile
      </Link>
    </div>
  )
}

export function ProfileReadyNote({ text }: { text: string }) {
  return (
    <p className="flex items-center gap-2 text-sm text-emerald-700">
      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
      {text}
    </p>
  )
}
