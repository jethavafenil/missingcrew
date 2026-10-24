'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { ConnectionButton } from '@/components/network/ConnectionButton'
import { HireButton } from '@/components/network/HireButton'
import { SocialShare } from '@/components/ui/social-share'
import { ShowreelPlayer } from '@/components/crew-view/ShowreelPlayer'
import { useSession } from '@/lib/auth/session-context'
import { buildProfileShareMessage } from '@/lib/shareMessages'
import { PROJECT_TYPES } from '@/lib/projectTypes'
import { emailComposeUrl, whatsappUrl } from '@/lib/contactLinks'
import type { Credit } from '@/lib/crew/credits'
import {
  ChevronLeft,
  MapPin,
  Calendar,
  CheckCircle,
  Award,
  BadgeCheck,
  ExternalLink,
  Lock,
  Briefcase,
  Film,
  Clapperboard,
  Star,
} from 'lucide-react'

const CrewNetworkSection = dynamic(() => import('@/components/network/CrewNetworkSection').then(m => m.CrewNetworkSection), { ssr: false })

interface PastProject {
  title?: string
  year?: number | string
  role?: string
  link?: string | null
  type?: string | null
  notes?: string | null
}

interface CrewProfile {
  id: string
  user: {
    id: string
    name: string
    email?: string
    phone?: string
    phoneVerified: boolean
  }
  photo: string | null
  city: string | null
  primaryRoles: string[]
  yearsExperience: string | null
  firstProjectDate: string | null
  showreelUrl: string | null
  tags: string[]
  location: string | null
  availableToTravel: boolean
  availability: boolean
  availabilityStart: string | null
  availabilityEnd: string | null
  projectTypes: string[]
  dailyBudgetMin: number | null
  dailyBudgetMax: number | null
  budgetFlexible: boolean
  languages: string[]
  imdbLink: string | null
  portfolioLinks: string[]
  pastProjects: unknown
  referredBy: string | null
  contactWhatsApp: string | null
  subscriptionTier: string
  hasProBadge?: boolean
  linksHidden?: boolean
  skills?: string[]
  specializations?: string[]
  bio?: string
}

interface CreditsData {
  credits: Credit[]
  currentEngagements: Credit[]
  hiredCount: number
  locked: boolean
}

interface ReviewsData {
  reviews: Array<{ id: string; rating: number; comment: string; createdAt: string; projectName: string; producerName: string }>
  average: number | null
  count: number
  eligible: Array<{ projectId: string; projectName: string; reviewed: boolean; rating: number | null; comment: string }>
}

type TabId = 'overview' | 'portfolio' | 'credits' | 'reviews' | 'details' | 'availability' | 'contact'

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'overview', label: 'Showreel' },
  { id: 'portfolio', label: 'Projects' },
  { id: 'credits', label: 'Credits' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'details', label: 'Skills & Details' },
  { id: 'availability', label: 'Availability' },
  { id: 'contact', label: 'Contact' },
]

const slugify = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

const monthYear = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }) : null

const shortDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : null

function datesLabel(c: Pick<Credit, 'startDate' | 'endDate'>): string | null {
  const a = shortDate(c.startDate)
  const b = shortDate(c.endDate)
  const y = c.endDate ? new Date(c.endDate).getFullYear() : c.startDate ? new Date(c.startDate).getFullYear() : null
  if (a && b) return a === b ? `${a} ${y}` : `${a} – ${b} ${y}`
  if (a) return `From ${a} ${y}`
  return null
}

function parsePastProjects(value: unknown): PastProject[] {
  let list: unknown = value
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list)
    } catch {
      return []
    }
  }
  if (!Array.isArray(list)) return []
  return list.filter((p): p is PastProject => !!p && typeof p === 'object' && Boolean((p as PastProject).title))
}

export default function CrewProfilePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [crew, setCrew] = useState<CrewProfile | null>(null)
  const [creditsData, setCreditsData] = useState<CreditsData | null>(null)
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const fromProject = searchParams.get('fromProject') === 'true'

  const fetchCrewProfile = useCallback(async (crewId: string) => {
    try {
      const response = await fetch(`/api/crew/${crewId}`)
      if (response.ok) {
        const data = await response.json()
        setCrew(data.crew)
        if (data?.crew?.user?.name && slugify(data.crew.user.name) !== crewId) {
          router.replace(`/crew/${slugify(data.crew.user.name)}`)
        }
        // credits are loaded alongside; they are optional for the page to render
        fetch(`/api/crew/${data.crew.id}/credits`)
          .then((r) => (r.ok ? r.json() : null))
          .then((c) => c && setCreditsData(c))
          .catch(() => {})
        fetch(`/api/crew/${data.crew.id}/reviews`)
          .then((r) => (r.ok ? r.json() : null))
          .then((v) => v && setReviewsData(v))
          .catch(() => {})
      } else {
        router.push('/browse-crew')
      }
    } catch (error) {
      console.error('Error fetching crew profile:', error)
      router.push('/browse-crew')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  // Load once the session is known, and again when the viewer signs in/out so work
  // links, credits and contact details unlock without a manual reload.
  const viewerId = session?.user?.id
  useEffect(() => {
    if (status === 'loading' || !params.id) return
    fetchCrewProfile(params.id as string)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, status, viewerId])

  const reloadReviews = useCallback(() => {
    if (!crew?.id) return
    fetch(`/api/crew/${crew.id}/reviews`)
      .then((r) => (r.ok ? r.json() : null))
      .then((v) => v && setReviewsData(v))
      .catch(() => {})
  }, [crew?.id])

  const pastProjects = useMemo(() => parsePastProjects(crew?.pastProjects), [crew?.pastProjects])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!crew || !crew.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-xl p-12 max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Crew Member Not Found</h1>
          <p className="text-gray-600 mb-6">The profile you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Button onClick={() => router.push('/browse-crew')} className="bg-gradient-to-r from-indigo-600 to-purple-600">
            Back to Browse Crew
          </Button>
        </div>
      </div>
    )
  }

  const canViewContacts = !!(session?.user?.role === 'EMPLOYER' || session?.user?.id === crew.user.id)
  const signedIn = !!session?.user?.id
  const firstName = crew.user.name.split(' ')[0]
  const firstProject = monthYear(crew.firstProjectDate)
  const returnUrl = encodeURIComponent(typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '')
  const signUpHref = `/accounts?tab=signup&role=employer&returnUrl=${returnUrl}`
  const signInHref = `/accounts?tab=signin&role=employer&returnUrl=${returnUrl}`
  const hiredCount = creditsData?.hiredCount ?? 0
  const engagements = creditsData?.currentEngagements ?? []
  const hasPro = crew.hasProBadge ?? crew.subscriptionTier === 'PRO'
  const budget =
    crew.dailyBudgetMin && crew.dailyBudgetMax
      ? `₹${crew.dailyBudgetMin.toLocaleString('en-IN')} – ₹${crew.dailyBudgetMax.toLocaleString('en-IN')} / day`
      : crew.dailyBudgetMin
        ? `From ₹${crew.dailyBudgetMin.toLocaleString('en-IN')} / day`
        : null

  const stats: Array<{ label: string; value: string }> = [
    { label: firstProject ? 'First project' : 'Experience', value: firstProject ?? (crew.yearsExperience || '—') },
    { label: 'Hired on MissingCrew', value: String(hiredCount) },
    { label: 'Portfolio projects', value: String(pastProjects.length) },
    { label: reviewsData && reviewsData.count > 0 ? `Rating (${reviewsData.count})` : 'Rating', value: reviewsData?.average != null ? `★ ${reviewsData.average.toFixed(1)}` : '—' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
        <Button
          variant="outline"
          onClick={() => router.push(fromProject ? '/employer/dashboard' : '/browse-crew')}
          className="mb-5 hover:bg-indigo-50 hover:border-indigo-300 transition-all"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {fromProject ? 'Back to Projects' : 'Back to Crew'}
        </Button>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-6">
          <div className="p-5 sm:p-8 grid gap-6 md:grid-cols-[220px_1fr] md:gap-8">
            <div className="mx-auto md:mx-0 w-36 sm:w-44 md:w-full">
              <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 shadow-xl flex items-center justify-center">
                {crew.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={crew.photo} alt={crew.user.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-6xl font-bold text-indigo-600">{crew.user.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </div>

            <div className="min-w-0 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 break-words">{crew.user.name}</h1>
                {crew.user.phoneVerified && <BadgeCheck className="h-6 w-6 text-blue-500" aria-label="Phone verified" />}
                {hasPro && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 text-xs font-bold text-white shadow">
                    <Award className="h-3.5 w-3.5" /> PRO
                  </span>
                )}
              </div>
              <p className="mt-1 text-lg sm:text-xl font-semibold text-indigo-600">{crew.primaryRoles.join(' • ')}</p>

              <div className="mt-3 flex flex-wrap items-center justify-center md:justify-start gap-2 text-sm">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 font-medium text-gray-700">
                  <MapPin className="h-4 w-4 text-indigo-600" />
                  {crew.location || crew.city || 'Location not specified'}
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold ${crew.availability ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                  <span className={`h-2 w-2 rounded-full ${crew.availability ? 'bg-green-500' : 'bg-orange-500'}`} />
                  {crew.availability ? 'Available' : 'Booked'}
                </span>
                {firstProject && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 font-medium text-gray-700">
                    <Calendar className="h-4 w-4 text-indigo-600" /> Since {firstProject}
                  </span>
                )}
                {budget && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 font-medium text-gray-700">
                    {budget}
                    {crew.budgetFlexible && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Negotiable</span>
                    )}
                  </span>
                )}
              </div>

              {crew.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center justify-center md:justify-start gap-1.5">
                  {crew.tags.slice(0, 8).map((t) => (
                    <Link
                      key={t}
                      href={`/browse-crew?tag=${encodeURIComponent(t)}`}
                      className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                    >
                      #{t}
                    </Link>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="mt-5 flex flex-wrap items-center justify-center md:justify-start gap-3">
                <HireButton crewUserId={crew.user.id} crewId={crew.id} crewName={crew.user.name} crewRoles={crew.primaryRoles ?? []} />
                <Button variant="outline" onClick={() => setActiveTab('contact')}>
                  Message {firstName}
                </Button>
                {session?.user?.id && (
                  <ConnectionButton userId={crew.user.id} currentUserId={session.user.id} onSuccess={() => {}} />
                )}
                <SocialShare
                  url={typeof window !== 'undefined' ? window.location.href : `https://missingcrew.vercel.app/crew/${params.id}`}
                  title={`Check out ${crew.user.name}'s profile on MissingCrew`}
                  description={`${crew.primaryRoles.join(', ')} on MissingCrew`}
                  message={buildProfileShareMessage({ name: crew.user.name, role: crew.primaryRoles?.[0], city: crew.city })}
                />
              </div>

              {/* Stats */}
              <dl className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 rounded-xl border border-gray-100 bg-gray-50/60 p-3 text-center">
                {stats.map((s) => (
                  <div key={s.label}>
                    <dd className="text-lg sm:text-xl font-bold text-gray-900">{s.value}</dd>
                    <dt className="text-[11px] sm:text-xs text-gray-500">{s.label}</dt>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* Current engagement */}
          {engagements.length > 0 && (
            <div className="border-t border-gray-100 bg-emerald-50/60 px-5 py-4 sm:px-8">
              <h2 className="text-xs font-bold uppercase tracking-wide text-emerald-700">Current engagement</h2>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {engagements.map((e) => (
                  <div key={e.projectId} className="rounded-xl border border-emerald-100 bg-white p-3 text-sm">
                    <p className="font-semibold text-gray-900">{e.projectName}</p>
                    <p className="text-gray-600">
                      {e.production && <>Production House: {e.production} · </>}Role: {e.role}
                    </p>
                    <p className="text-gray-600">
                      {datesLabel(e) && <>Engagement: {datesLabel(e)} · </>}
                      <span className="font-semibold text-emerald-700">Status: Confirmed</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-t-2xl shadow-lg border border-b-0 border-gray-200">
          <nav className="flex gap-1 overflow-x-auto p-2" role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  activeTab === tab.id ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="bg-white rounded-b-2xl shadow-lg border border-t-0 border-gray-200 p-5 sm:p-8">
          {activeTab === 'overview' && <OverviewTab crew={crew} pastProjects={pastProjects} />}
          {activeTab === 'portfolio' && <PortfolioTab crew={crew} pastProjects={pastProjects} signedIn={signedIn} signUpHref={signUpHref} signInHref={signInHref} />}
          {activeTab === 'credits' && <CreditsTab data={creditsData} signUpHref={signUpHref} signInHref={signInHref} />}
          {activeTab === 'reviews' && <ReviewsTab crewId={crew.id} data={reviewsData} onChanged={reloadReviews} />}
          {activeTab === 'details' && <DetailsTab crew={crew} />}
          {activeTab === 'availability' && <AvailabilityTab crew={crew} />}
          {activeTab === 'contact' && <ContactTab crew={crew} canViewContacts={canViewContacts} canMessage={session?.user?.role === 'EMPLOYER'} signedIn={signedIn} signInHref={signInHref} signUpHref={signUpHref} />}
        </div>

        <div className="mt-6">
          <CrewNetworkSection crewUserId={crew.user.id} />
        </div>
      </div>
    </div>
  )
}

function LockedNotice({ signUpHref, signInHref, text }: { signUpHref: string; signInHref: string; text: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-indigo-900 sm:flex-row sm:items-center sm:justify-between">
      <span className="flex items-start gap-2 text-sm">
        <Lock className="mt-0.5 h-4 w-4 shrink-0" /> {text}
      </span>
      <span className="flex shrink-0 gap-2">
        <Link href={signUpHref} className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">Sign up free</Link>
        <Link href={signInHref} className="rounded-md border border-indigo-300 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-white">Sign in</Link>
      </span>
    </div>
  )
}

function OverviewTab({ crew, pastProjects }: { crew: CrewProfile; pastProjects: PastProject[] }) {
  return (
    <div className="space-y-6">
      {crew.showreelUrl ? (
        <ShowreelPlayer url={crew.showreelUrl} name={crew.user.name} />
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
          <Film className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          {crew.user.name.split(' ')[0]} hasn&apos;t added a showreel yet.
        </div>
      )}
      {crew.bio && <p className="whitespace-pre-line text-gray-700">{crew.bio}</p>}
      {pastProjects.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">Selected projects</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {pastProjects.slice(0, 3).map((p, i) => (
              <div key={i} className="rounded-xl border border-gray-200 p-3">
                <Clapperboard className="mb-1 h-4 w-4 text-indigo-500" />
                <p className="font-semibold text-gray-900">{p.title}</p>
                <p className="text-sm text-gray-500">{[p.type, p.role, p.year].filter(Boolean).join(' · ')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PortfolioTab({ crew, pastProjects, signedIn, signUpHref, signInHref }: { crew: CrewProfile; pastProjects: PastProject[]; signedIn: boolean; signUpHref: string; signInHref: string }) {
  const [type, setType] = useState<string>('All')
  const counts = new Map<string, number>()
  for (const p of pastProjects) counts.set(p.type || 'Other', (counts.get(p.type || 'Other') ?? 0) + 1)
  const types = [...PROJECT_TYPES.filter((t) => counts.has(t)), ...(counts.has('Other') ? ['Other'] : [])]
  const shown = type === 'All' ? pastProjects : pastProjects.filter((p) => (p.type || 'Other') === type)
  const extraLinks = (crew.portfolioLinks ?? []).filter((l) => typeof l === 'string')

  if (pastProjects.length === 0 && extraLinks.length === 0 && !crew.imdbLink) {
    return <p className="py-8 text-center text-gray-500">No projects added yet.</p>
  }

  return (
    <div className="space-y-6">
      {!signedIn && (
        <LockedNotice signUpHref={signUpHref} signInHref={signInHref} text="Sign up as a producer to open the work links and the IMDb profile." />
      )}

      {types.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {['All', ...types].map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`rounded-full border px-3 py-1 text-sm font-medium ${type === t ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              {t}
              {t !== 'All' && <span className="ml-1 opacity-70">{counts.get(t)}</span>}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-3">
        {shown.map((p, i) => (
          <div key={i} className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 p-4">
            <div className="min-w-0">
              <p className="font-semibold text-gray-900">{p.title}</p>
              <p className="text-sm text-gray-500">{[p.type, p.role, p.year].filter(Boolean).join(' · ')}</p>
            </div>
            {p.link ? (
              <a href={p.link} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800">
                View work <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : !signedIn ? (
              <span className="inline-flex shrink-0 items-center gap-1 text-xs text-gray-400"><Lock className="h-3 w-3" /> Sign in</span>
            ) : null}
          </div>
        ))}
      </div>

      {signedIn && (extraLinks.length > 0 || crew.imdbLink) && (
        <div>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">More links</h3>
          <div className="grid gap-2">
            {crew.imdbLink && (
              <a href={crew.imdbLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 hover:border-yellow-300 hover:bg-yellow-50">
                <span>🎬</span> <span className="text-gray-700">IMDb profile</span>
              </a>
            )}
            {extraLinks.map((l) => (
              <a key={l} href={l} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 truncate rounded-lg border border-gray-200 p-3 hover:border-indigo-300 hover:bg-indigo-50">
                <span>🔗</span> <span className="truncate text-gray-700">{l}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CreditsTab({ data, signUpHref, signInHref }: { data: CreditsData | null; signUpHref: string; signInHref: string }) {
  if (!data) return <p className="py-8 text-center text-gray-500">Loading credits…</p>
  if (data.locked) {
    return (
      <div className="space-y-4">
        <p className="text-gray-700">
          Hired on MissingCrew: <span className="font-bold">{data.hiredCount}</span> {data.hiredCount === 1 ? 'project' : 'projects'}
        </p>
        <LockedNotice signUpHref={signUpHref} signInHref={signInHref} text="Sign up as a producer to see the verified production credits." />
      </div>
    )
  }
  if (data.credits.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <Briefcase className="mx-auto mb-2 h-8 w-8 text-gray-300" />
        No verified credits yet. They appear here once a producer hires this crew member on MissingCrew.
      </div>
    )
  }
  return (
    <div className="grid gap-3">
      {data.credits.map((c) => (
        <div key={c.projectId} className="rounded-xl border border-gray-200 p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
            <CheckCircle className="h-4 w-4" /> Verified Production Credit
          </p>
          <p className="mt-1 font-semibold text-gray-900">Project: {c.projectName}</p>
          <p className="text-sm text-gray-600">Role: {c.role}</p>
          {c.production && <p className="text-sm text-gray-600">Production: {c.production}</p>}
          {datesLabel(c) && <p className="text-sm text-gray-600">Dates: {datesLabel(c)}</p>}
          <p className="mt-1 text-xs text-gray-500">Confirmed by Producer</p>
        </div>
      ))}
    </div>
  )
}

function Stars({ value, size = 'h-4 w-4' }: { value: number; size?: string }) {
  return (
    <span className="inline-flex" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${size} ${n <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
      ))}
    </span>
  )
}

function ReviewsTab({ crewId, data, onChanged }: { crewId: string; data: ReviewsData | null; onChanged: () => void }) {
  const eligible = data?.eligible ?? []
  const [projectId, setProjectId] = useState('')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const chosen = eligible.find((e) => e.projectId === (projectId || eligible[0]?.projectId))
  const activeProject = chosen?.projectId ?? ''

  useEffect(() => {
    // switching project pre-fills that project's existing review (if any)
    setRating(chosen?.rating ?? 0)
    setComment(chosen?.comment ?? '')
    setDone(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosen?.projectId])

  if (!data) return <p className="py-8 text-center text-gray-500">Loading reviews…</p>

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeProject) return
    if (rating < 1) {
      setError('Please pick a star rating')
      return
    }
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crewId, projectId: activeProject, rating, comment }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'Could not save the review')
      setDone(true)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the review')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {data.average != null ? (
          <>
            <span className="text-3xl font-bold text-gray-900">{data.average.toFixed(1)}</span>
            <Stars value={data.average} size="h-5 w-5" />
            <span className="text-sm text-gray-500">{data.count} {data.count === 1 ? 'review' : 'reviews'}</span>
          </>
        ) : (
          <p className="text-gray-500">No reviews yet. Only producers who hired this crew member can review them.</p>
        )}
      </div>

      {eligible.length > 0 && (
        <form onSubmit={submit} className="space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
          <h3 className="font-semibold text-gray-900">{chosen?.reviewed ? 'Edit your review' : 'Review this crew member'}</h3>
          {eligible.length > 1 && (
            <select value={activeProject} onChange={(e) => setProjectId(e.target.value)} className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base">
              {eligible.map((p) => (
                <option key={p.projectId} value={p.projectId}>
                  {p.projectName}{p.reviewed ? ' (reviewed)' : ''}
                </option>
              ))}
            </select>
          )}
          {eligible.length === 1 && <p className="text-sm text-gray-600">For {eligible[0].projectName}</p>}
          <div className="flex gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setRating(n)}>
                <Star className={`h-8 w-8 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="How was it working with them? (optional)"
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          {done && <p className="text-sm text-emerald-700">Thanks, your review is saved.</p>}
          <Button type="submit" disabled={busy}>{busy ? 'Saving…' : chosen?.reviewed ? 'Update review' : 'Submit review'}</Button>
        </form>
      )}

      <div className="space-y-3">
        {data.reviews.map((r) => (
          <div key={r.id} className="rounded-xl border border-gray-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Stars value={r.rating} />
              <span className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
            </div>
            {r.comment && <p className="mt-2 whitespace-pre-line text-gray-700">{r.comment}</p>}
            <p className="mt-2 text-xs text-gray-500">{r.producerName} · {r.projectName}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function Chips({ title, items, tone }: { title: string; items?: string[]; tone: string }) {
  if (!items || items.length === 0) return null
  return (
    <div>
      <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {items.map((i) => (
          <span key={i} className={`rounded-full px-3 py-1 text-sm font-medium ${tone}`}>{i}</span>
        ))}
      </div>
    </div>
  )
}

function DetailsTab({ crew }: { crew: CrewProfile }) {
  return (
    <div className="space-y-5">
      <Chips title="Roles" items={crew.primaryRoles} tone="bg-indigo-100 text-indigo-800" />
      <Chips title="Skills" items={crew.skills} tone="bg-green-100 text-green-800" />
      <Chips title="Specializations" items={crew.specializations} tone="bg-purple-100 text-purple-800" />
      <Chips title="Languages" items={Array.isArray(crew.languages) ? crew.languages : []} tone="bg-gray-100 text-gray-700" />
    </div>
  )
}

function AvailabilityTab({ crew }: { crew: CrewProfile }) {
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return (
    <div className="space-y-3">
      <p className="text-lg font-semibold text-gray-900">
        {crew.availability
          ? crew.availabilityStart && crew.availabilityEnd
            ? `Available ${fmt(crew.availabilityStart)} – ${fmt(crew.availabilityEnd)}`
            : 'Available immediately'
          : 'Currently booked'}
      </p>
      <p className="text-gray-600">{crew.availableToTravel ? 'Open to travel for projects.' : 'Prefers local projects.'}</p>
    </div>
  )
}

function ContactTab({ crew, canViewContacts, canMessage, signedIn, signInHref, signUpHref }: { crew: CrewProfile; canViewContacts: boolean; canMessage: boolean; signedIn: boolean; signInHref: string; signUpHref: string }) {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  const firstName = crew.user.name.split(' ')[0]
  const greeting = `Hi ${firstName}, I found your profile on MissingCrew and would like to talk about a project.`
  const email = crew.user.email
  const wa = crew.contactWhatsApp ? whatsappUrl(crew.contactWhatsApp, greeting) : null

  if (!canViewContacts) {
    return (
      <LockedNotice
        signUpHref={signUpHref}
        signInHref={signInHref}
        text={signedIn ? 'Contact details are visible to producers. Sign in with a producer account to see them.' : 'Sign up as a producer to see the contact details and message this crew member.'}
      />
    )
  }

  const rows: Array<{ label: string; value: string | null | undefined; action?: { href: string; text: string; external?: boolean } }> = [
    { label: 'Email', value: email, action: email ? { href: emailComposeUrl(email, ua, 'Project on MissingCrew', greeting), text: 'Email', external: true } : undefined },
    { label: 'Phone', value: crew.user.phone, action: crew.user.phone ? { href: `tel:${crew.user.phone}`, text: 'Call' } : undefined },
    { label: 'WhatsApp', value: crew.contactWhatsApp, action: wa ? { href: wa, text: 'Message', external: true } : undefined },
    { label: 'IMDb', value: crew.imdbLink, action: crew.imdbLink ? { href: crew.imdbLink, text: 'Open', external: true } : undefined },
  ]

  return (
    <div className="space-y-4">
    {canMessage && <MessageBox crewId={crew.id} greeting={greeting} />}
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map((r) => (
        <div key={r.label} className="rounded-xl border border-gray-200 p-4">
          <h4 className="mb-1 text-sm font-medium text-gray-500">{r.label}</h4>
          <div className="flex items-center justify-between gap-2">
            <span className="min-w-0 truncate text-gray-800">{r.value || 'Not provided'}</span>
            {r.action && (
              <a
                href={r.action.href}
                {...(r.action.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="shrink-0 rounded-md bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-700"
              >
                {r.action.text}
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
    </div>
  )
}

// One-click message from a producer: lands as a notification + email (Reply-To = producer).
function MessageBox({ crewId, greeting }: { crewId: string; greeting: string }) {
  const [text, setText] = useState(greeting)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setStatus('idle')
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crewId, message: text }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'Could not send the message')
      setStatus('sent')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the message')
      setStatus('error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={send} className="space-y-2 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
      <h3 className="font-semibold text-gray-900">Send a message</h3>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        maxLength={1000}
        required
        className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base"
      />
      {status === 'sent' && <p className="text-sm text-emerald-700">Message sent. They will reply to your email.</p>}
      {status === 'error' && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={busy || !text.trim()}>{busy ? 'Sending…' : 'Send message'}</Button>
    </form>
  )
}
