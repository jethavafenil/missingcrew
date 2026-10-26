'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Heart, MapPin, Calendar, Check, Award, Play } from 'lucide-react'
import { RolePlaceholder } from '@/components/crew-view/RolePlaceholder'
import { mutate as globalMutate } from 'swr'
import { useSession } from '@/lib/auth/session-context'
import { Button } from '../ui/button'
import { slugifyName } from '@/lib/utils'
import { hasProBadge } from '@/lib/subscription/access'
import { vimeoId, youtubeId } from '@/lib/crew/profileFields'

interface CrewCardProps {
  // Browse page: clicking a hashtag filters the list in place. Elsewhere it opens Browse Crew filtered.
  onTagClick?: (tag: string) => void
  crew: {
    id: string
    user: {
      name: string
      phoneVerified?: boolean
    }
    photo: string | null
    city: string | null
    primaryRoles: string[]
    yearsExperience: string | null
    firstProjectDate?: string | null
    showreelUrl?: string | null
    tags?: string[]
    location: string | null
    availability: boolean
    availabilityStart: string | null
    availabilityEnd: string | null
    portfolioLinks?: string[]
    subscriptionTier: string
    trialEnds?: string | Date | null
    hasProBadge?: boolean
  }
}

const dateOpts = { month: 'short', day: 'numeric' } as const

function availabilityText(crew: CrewCardProps['crew']): string {
  if (!crew.availability) return 'Currently booked'
  if (crew.availabilityStart && crew.availabilityEnd) {
    const a = new Date(crew.availabilityStart).toLocaleDateString('en-US', dateOpts)
    const b = new Date(crew.availabilityEnd).toLocaleDateString('en-US', dateOpts)
    return `Available ${a} – ${b}`
  }
  return 'Available now'
}

// The reel: the crew member's showreel, else the first YouTube/Vimeo link of their portfolio.
function pickReel(crew: CrewCardProps['crew']): string | null {
  if (crew.showreelUrl) return crew.showreelUrl
  return (crew.portfolioLinks ?? []).find((l) => typeof l === 'string' && (youtubeId(l) || vimeoId(l))) ?? null
}

export function CrewCard({ crew, onTagClick }: CrewCardProps) {
  const { data: session } = useSession()
  const isProducer = session?.user?.role === 'EMPLOYER'
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [thumbFailed, setThumbFailed] = useState(false)

  useEffect(() => {
    if (!isProducer) return
    let cancelled = false
    fetch(`/api/wishlist/check?crewId=${crew.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !cancelled && d && setIsWishlisted(!!d.isWishlisted))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [isProducer, crew.id])

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!session?.user?.id) return
    setBusy(true)
    try {
      const res = isWishlisted
        ? await fetch(`/api/wishlist?crewId=${crew.id}`, { method: 'DELETE' })
        : await fetch('/api/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ crewId: crew.id }) })
      if (res.ok) {
        setIsWishlisted(!isWishlisted)
        void globalMutate('/api/wishlist') // refresh the bucket list count in the header
      }
    } catch (error) {
      console.error('Bucket list update failed:', error)
    } finally {
      setBusy(false)
    }
  }

  const reel = pickReel(crew)
  const yt = youtubeId(reel)
  const vm = vimeoId(reel)
  const hasVideo = !!(yt || vm)
  const embed = yt
    ? `https://www.youtube.com/embed/${yt}?autoplay=1&mute=1&controls=0&loop=1&playlist=${yt}&playsinline=1&rel=0`
    : vm
      ? `https://player.vimeo.com/video/${vm}?autoplay=1&muted=1&background=1`
      : null

  const since = crew.firstProjectDate ? new Date(crew.firstProjectDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }) : null
  const place = crew.location || crew.city || 'Location not specified'
  const profileHref = `/crew/${slugifyName(crew.user.name)}`
  const pro = crew.hasProBadge ?? hasProBadge(crew)

  return (
    <div className="group flex min-h-[340px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md transition hover:shadow-xl">
      {/* Reel: plays on hover (desktop) or tap (touch) */}
      <div
        className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100"
        onMouseEnter={() => hasVideo && setPlaying(true)}
        onMouseLeave={() => setPlaying(false)}
      >
        {playing && embed ? (
          <iframe src={embed} title={`${crew.user.name} showreel`} className="pointer-events-none absolute inset-0 h-full w-full" allow="autoplay; encrypted-media; picture-in-picture" loading="lazy" />
        ) : (
          <>
            {yt && !thumbFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`https://img.youtube.com/vi/${yt}/hqdefault.jpg`} alt="" loading="lazy" onError={() => setThumbFailed(true)} className="h-full w-full object-cover" />
            ) : crew.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={crew.photo} alt="" loading="lazy" className="h-full w-full object-cover opacity-90" />
            ) : (
              // No thumbnail and no photo: a picture for their department
              <RolePlaceholder role={crew.primaryRoles[0]} />
            )}
            {hasVideo && (
              <button
                type="button"
                onClick={() => setPlaying(true)}
                aria-label={`Play ${crew.user.name} showreel`}
                className="absolute inset-0 flex items-center justify-center bg-black/10 transition group-hover:bg-black/20"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-lg">
                  <Play className="ml-0.5 h-5 w-5 text-gray-900" />
                </span>
              </button>
            )}
          </>
        )}

        {pro && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-0.5 text-[11px] font-bold text-white shadow">
            <Award className="h-3 w-3" /> PRO
          </span>
        )}
        {isProducer && (
          <button
            type="button"
            onClick={toggleWishlist}
            disabled={busy}
            title={isWishlisted ? 'Remove from bucket list' : 'Add to bucket list'}
            aria-label={isWishlisted ? 'Remove from bucket list' : 'Add to bucket list'}
            className="absolute right-2 top-2 rounded-full bg-white/90 p-2 shadow transition hover:scale-110 disabled:opacity-50"
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} />
          </button>
        )}
      </div>

      {/* Who they are */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow">
            {crew.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={crew.photo} alt={`${crew.user.name}'s photo`} loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <RolePlaceholder role={crew.primaryRoles[0]} />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="flex items-center gap-1 truncate text-base font-bold text-gray-900">
              <span className="truncate">{crew.user.name}</span>
              {crew.user.phoneVerified && <Check className="h-4 w-4 shrink-0 text-green-600" aria-label="Verified" />}
            </h3>
            <p className="truncate text-sm font-medium text-indigo-600">
              {crew.primaryRoles[0] || 'Professional'}
              {crew.primaryRoles.length > 1 && <span className="text-gray-500"> +{crew.primaryRoles.length - 1}</span>}
            </p>
          </div>
        </div>

        <div className="space-y-1.5 text-sm text-gray-700">
          <p className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0 text-indigo-500" />
            <span className="truncate">{place}</span>
          </p>
          <p className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 shrink-0 text-purple-500" />
            <span className="truncate">{since ? `Since ${since}` : crew.yearsExperience || 'Experience not specified'}</span>
          </p>
          <p className={`flex items-center gap-1.5 text-xs font-semibold ${crew.availability ? 'text-green-700' : 'text-orange-700'}`}>
            <span className={`h-2 w-2 shrink-0 rounded-full ${crew.availability ? 'bg-green-500' : 'bg-orange-500'}`} />
            <span className="truncate">{availabilityText(crew)}</span>
          </p>
        </div>

        {crew.tags && crew.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {crew.tags.slice(0, 3).map((t) =>
              onTagClick ? (
                <button
                  key={t}
                  type="button"
                  onClick={() => onTagClick(t)}
                  className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 transition hover:bg-indigo-100 hover:text-indigo-900"
                >
                  #{t}
                </button>
              ) : (
                <Link key={t} href={`/browse-crew?tag=${encodeURIComponent(t)}`} className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 transition hover:bg-indigo-100 hover:text-indigo-900">
                  #{t}
                </Link>
              ),
            )}
          </div>
        )}

        <Link href={profileHref} className="mt-auto block">
          <Button size="sm" className="w-full rounded-xl border-0 bg-gradient-to-r from-indigo-600 to-purple-600 font-bold text-white shadow-md hover:shadow-lg">
            View Full Profile
          </Button>
        </Link>
      </div>
    </div>
  )
}
