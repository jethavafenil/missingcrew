'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { ChevronLeft, MapPin, Lock, ExternalLink, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HireNowModal } from '@/components/hire/HireNowModal'
import { ShowreelPlayer } from '@/components/crew-view/ShowreelPlayer'
import { swrFetcher } from '@/lib/swr'
import { crewTags, matchScore } from '@/lib/matching'
import { formatShootRange } from '@/lib/projects/format'
import { displayHashtags } from '@/lib/projectTags'
import type { Credit } from '@/lib/crew/credits'

type AppStatus = 'PENDING' | 'SHORTLISTED' | 'REJECTED' | 'HIRED'

export interface ReviewApplication {
  id: string
  appliedAt: string
  status?: AppStatus
  answers: string[]
  crew: {
    id: string
    photo?: string | null
    user: { name: string }
    primaryRoles?: string[]
    yearsExperience?: string | null
    city?: string | null
    location?: string | null
    projectTypes?: string[]
    pastProjects?: unknown
    customTags?: string[]
    dailyBudgetMin?: number | null
    dailyBudgetMax?: number | null
    budgetFlexible?: boolean
    availability?: boolean
    firstProjectDate?: string | null
  }
}

export interface ReviewProject {
  id: string
  projectName: string
  projectType: string
  location: string
  shootStartDate: string | null
  shootEndDate: string | null
  rolesNeeded: string[]
  tags?: string[]
  budgetMin?: number | null
  budgetMax?: number | null
  questions: string[]
  status: string
  applications: ReviewApplication[]
}

interface Props {
  projects: ReviewProject[]
  updatingId: string | null
  error: string | null
  onStatus: (projectId: string, applicationId: string, status: 'PENDING' | 'SHORTLISTED' | 'REJECTED') => void
  onRefresh: () => void
}

type Filter = 'ALL' | 'SHORTLISTED' | 'HIRED' | 'REJECTED'
type Sort = 'match' | 'first' | 'newest'

const STATUS_STYLE: Record<AppStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  SHORTLISTED: 'bg-indigo-100 text-indigo-800',
  REJECTED: 'bg-red-100 text-red-800',
  HIRED: 'bg-emerald-100 text-emerald-800',
}
const STATUS_LABEL: Record<AppStatus, string> = { PENDING: 'Applied', SHORTLISTED: 'Shortlisted', REJECTED: 'Rejected', HIRED: 'Hired' }

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`
const fee = (c: ReviewApplication['crew']) =>
  c.dailyBudgetMin && c.dailyBudgetMax ? `${inr(c.dailyBudgetMin)} – ${inr(c.dailyBudgetMax)}` : c.dailyBudgetMin ? `From ${inr(c.dailyBudgetMin)}` : null

function scoreFor(app: ReviewApplication, project: ReviewProject): number {
  return matchScore(
    { ...app.crew, primaryRoles: app.crew.primaryRoles ?? [], projectTypes: app.crew.projectTypes ?? [] },
    { projectType: project.projectType, rolesNeeded: project.rolesNeeded, tags: project.tags, location: project.location, budgetMin: project.budgetMin, budgetMax: project.budgetMax },
  )
}

function matchTone(score: number): string {
  return score >= 80 ? 'bg-green-100 text-green-700' : score >= 55 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
}

function Avatar({ name, photo, size = 'h-12 w-12' }: { name: string; photo?: string | null; size?: string }) {
  return photo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={photo} alt={name} className={`${size} shrink-0 rounded-full object-cover`} />
  ) : (
    <span className={`${size} flex shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-600`}>{name.charAt(0).toUpperCase()}</span>
  )
}

export function ApplicantReview({ projects, updatingId, error, onStatus, onRefresh }: Props) {
  const withApps = projects.filter((p) => p.applications.length > 0)
  const [projectId, setProjectId] = useState<string>(withApps[0]?.id ?? '')
  const [filter, setFilter] = useState<Filter>('ALL')
  const [sort, setSort] = useState<Sort>('match')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileDetail, setMobileDetail] = useState(false)

  const project = withApps.find((p) => p.id === projectId) ?? withApps[0]

  const rows = useMemo(() => {
    if (!project) return []
    const withScore = project.applications.map((a) => ({ app: a, score: scoreFor(a, project) }))
    const filtered = withScore.filter(({ app }) => {
      const st = app.status ?? 'PENDING'
      return filter === 'ALL' ? true : st === filter
    })
    return filtered.sort((a, b) => {
      if (sort === 'match') return b.score - a.score || Date.parse(a.app.appliedAt) - Date.parse(b.app.appliedAt)
      if (sort === 'newest') return Date.parse(b.app.appliedAt) - Date.parse(a.app.appliedAt)
      return Date.parse(a.app.appliedAt) - Date.parse(b.app.appliedAt)
    })
  }, [project, filter, sort])

  if (!project) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-600">You haven&apos;t received any applications yet.</p>
      </div>
    )
  }

  const counts = {
    ALL: project.applications.length,
    SHORTLISTED: project.applications.filter((a) => a.status === 'SHORTLISTED').length,
    HIRED: project.applications.filter((a) => a.status === 'HIRED').length,
    REJECTED: project.applications.filter((a) => a.status === 'REJECTED').length,
  }
  const selected = rows.find((r) => r.app.id === selectedId) ?? rows[0]

  const select = (id: string) => {
    setSelectedId(id)
    setMobileDetail(true)
  }

  return (
    <div className="space-y-4">
      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {/* Project header */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {withApps.length > 1 ? (
            <select
              value={project.id}
              onChange={(e) => {
                setProjectId(e.target.value)
                setSelectedId(null)
                setMobileDetail(false)
              }}
              className="max-w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base font-semibold text-gray-900"
              aria-label="Project"
            >
              {withApps.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectName} ({p.applications.length})
                </option>
              ))}
            </select>
          ) : (
            <h3 className="truncate text-lg font-semibold text-gray-900">{project.projectName}</h3>
          )}
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
            <span>{project.projectType}</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {project.location}
            </span>
            <span>{formatShootRange(project.shootStartDate, project.shootEndDate)}</span>
          </p>
          <p className="mt-1 flex flex-wrap gap-1.5">
            {displayHashtags(project.projectType, project.tags).map((t) => (
              <span key={t} className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                {t}
              </span>
            ))}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          Refresh
        </Button>
      </div>

      {/* Status filter */}
      <div className="flex gap-1 overflow-x-auto border-b border-gray-200">
        {(['ALL', 'SHORTLISTED', 'HIRED', 'REJECTED'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${filter === f ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            {f === 'ALL' ? 'Applications' : STATUS_LABEL[f === 'SHORTLISTED' ? 'SHORTLISTED' : f === 'HIRED' ? 'HIRED' : 'REJECTED']} ({counts[f]})
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* Left: list */}
        <div className={`${mobileDetail ? 'hidden lg:block' : ''} space-y-2`}>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            Sort by
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="flex-1 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm">
              <option value="match">Best match</option>
              <option value="first">First applied</option>
              <option value="newest">Newest</option>
            </select>
          </label>
          {rows.length === 0 && <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">No applicants in this view.</p>}
          {rows.map(({ app, score }) => {
            const st = app.status ?? 'PENDING'
            const active = selected?.app.id === app.id
            return (
              <button
                key={app.id}
                onClick={() => select(app.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${active ? 'border-indigo-400 bg-indigo-50/60' : 'border-gray-200 bg-white hover:border-indigo-200'}`}
              >
                <Avatar name={app.crew.user.name} photo={app.crew.photo} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-gray-900">{app.crew.user.name}</span>
                  <span className="block truncate text-xs text-gray-500">{[app.crew.primaryRoles?.[0], app.crew.city].filter(Boolean).join(' · ')}</span>
                  <span className="mt-1 flex items-center gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${matchTone(score)}`}>{score}% match</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[st]}`}>{STATUS_LABEL[st]}</span>
                  </span>
                </span>
                {fee(app.crew) && <span className="hidden text-right text-xs font-medium text-gray-700 sm:block">{fee(app.crew)}</span>}
              </button>
            )
          })}
        </div>

        {/* Right: detail */}
        <div className={`${mobileDetail ? '' : 'hidden lg:block'} min-w-0`}>
          {selected && (
            <ApplicantDetail
              key={selected.app.id}
              app={selected.app}
              project={project}
              score={selected.score}
              busy={updatingId === selected.app.id}
              onBack={() => setMobileDetail(false)}
              onStatus={(s) => onStatus(project.id, selected.app.id, s)}
              onHired={onRefresh}
            />
          )}
        </div>
      </div>
    </div>
  )
}

interface PublicCrew {
  id: string
  showreelUrl: string | null
  tags: string[]
  imdbLink: string | null
  pastProjects: unknown
  portfolioLinks: string[]
  availabilityStart: string | null
  availabilityEnd: string | null
  availableToTravel: boolean
  hasProBadge?: boolean
}

function ApplicantDetail({
  app,
  project,
  score,
  busy,
  onBack,
  onStatus,
  onHired,
}: {
  app: ReviewApplication
  project: ReviewProject
  score: number
  busy: boolean
  onBack: () => void
  onStatus: (s: 'PENDING' | 'SHORTLISTED' | 'REJECTED') => void
  onHired: () => void
}) {
  const [tab, setTab] = useState<'overview' | 'portfolio' | 'credits' | 'answers'>('overview')
  const [hireOpen, setHireOpen] = useState(false)
  const { data: profile } = useSWR<{ crew: PublicCrew }>(`/api/crew/${app.crew.id}`, swrFetcher, { revalidateOnFocus: false })
  const { data: credits } = useSWR<{ credits: Credit[]; hiredCount: number }>(`/api/crew/${app.crew.id}/credits`, swrFetcher, { revalidateOnFocus: false })
  const detail = profile?.crew
  const st = app.status ?? 'PENDING'
  const tags = detail?.tags ?? crewTags({ projectTypes: app.crew.projectTypes, customTags: app.crew.customTags, pastProjects: app.crew.pastProjects })
  // Work relevant to THIS project (same project type) comes first and is marked, so the
  // applicant does not have to pick links when applying.
  const projectTypes = project.projectType.split(/[,/]+/).map((t) => t.trim().toLowerCase()).filter(Boolean)
  const past = (Array.isArray(detail?.pastProjects ?? app.crew.pastProjects)
    ? ((detail?.pastProjects ?? app.crew.pastProjects) as Array<{ title?: string; type?: string; role?: string; year?: string | number; link?: string | null }>).filter((p) => p?.title)
    : []
  )
    .map((p) => ({ ...p, relevant: !!p.type && projectTypes.includes(p.type.toLowerCase()) }))
    .sort((a, b) => Number(b.relevant) - Number(a.relevant))
  const hiredCount = credits?.hiredCount ?? 0
  const crewSlug = app.crew.user.name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')

  const tabs: Array<{ id: typeof tab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'portfolio', label: `Portfolio (${past.length})` },
    { id: 'credits', label: `Credits (${hiredCount})` },
    ...(app.answers.length > 0 ? [{ id: 'answers' as const, label: 'Answers' }] : []),
  ]

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <button onClick={onBack} className="flex items-center gap-1 px-4 pt-3 text-sm text-indigo-600 lg:hidden">
        <ChevronLeft className="h-4 w-4" /> Back to applicants
      </button>

      <div className="flex flex-col gap-3 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={app.crew.user.name} photo={app.crew.photo} size="h-16 w-16" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-xl font-bold text-gray-900">{app.crew.user.name}</h3>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${matchTone(score)}`}>{score}% match</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[st]}`}>{STATUS_LABEL[st]}</span>
            </div>
            <p className="text-sm text-gray-600">
              {[app.crew.primaryRoles?.join(' · '), app.crew.city || app.crew.location].filter(Boolean).join(' • ')}
            </p>
            <p className="text-xs text-gray-500">
              {hiredCount} hired on MissingCrew · {past.length} portfolio projects
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {st !== 'HIRED' && st !== 'SHORTLISTED' && (
            <Button size="sm" disabled={busy} onClick={() => onStatus('SHORTLISTED')}>
              Shortlist
            </Button>
          )}
          {st !== 'HIRED' && (
            <Button size="sm" variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50" onClick={() => setHireOpen(true)}>
              Hire
            </Button>
          )}
          {st !== 'HIRED' && st !== 'REJECTED' && (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => onStatus('REJECTED')}>
              Reject
            </Button>
          )}
          {(st === 'SHORTLISTED' || st === 'REJECTED') && (
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => onStatus('PENDING')}>
              Undo
            </Button>
          )}
          <Link href={`/crew/${crewSlug}?fromProject=true`} className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
            Full profile <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-b border-gray-200 px-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${tab === t.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="space-y-4 p-4">
        {tab === 'overview' && (
          <>
            {detail?.showreelUrl ? (
              <ShowreelPlayer url={detail.showreelUrl} name={app.crew.user.name} />
            ) : (
              <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">No showreel added.</p>
            )}
            {tags.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-500">Key skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <span key={t} className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <dl className="grid grid-cols-1 gap-3 rounded-xl bg-gray-50 p-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-gray-500">Expected fee (per day)</dt>
                <dd className="font-semibold text-gray-900">
                  {fee(app.crew) ?? 'Not specified'}
                  {app.crew.budgetFlexible && <span className="ml-1 rounded-full bg-green-100 px-1.5 py-0.5 text-[11px] text-green-700">Negotiable</span>}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Availability</dt>
                <dd className="font-semibold text-gray-900">
                  {app.crew.availability === false ? 'Booked' : detail?.availabilityStart && detail?.availabilityEnd ? formatShootRange(detail.availabilityStart, detail.availabilityEnd) : 'Available'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Location</dt>
                <dd className="font-semibold text-gray-900">{app.crew.city || app.crew.location || '—'}{detail?.availableToTravel ? ' (open to travel)' : ''}</dd>
              </div>
            </dl>
            <p className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="h-3.5 w-3.5" /> Applied {new Date(app.appliedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </>
        )}

        {tab === 'portfolio' && (
          <div className="space-y-2">
            {past.length === 0 && <p className="text-sm text-gray-500">No portfolio projects added.</p>}
            {past.map((p, i) => (
              <div key={i} className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 p-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">
                    {p.title}
                    {p.relevant && <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Relevant</span>}
                  </p>
                  <p className="text-xs text-gray-500">{[p.type, p.role, p.year].filter(Boolean).join(' · ')}</p>
                </div>
                {p.link && (
                  <a href={p.link} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-indigo-600">
                    View work <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            ))}
            {detail?.imdbLink && (
              <a href={detail.imdbLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 text-sm hover:bg-yellow-50">
                🎬 IMDb profile
              </a>
            )}
          </div>
        )}

        {tab === 'credits' && (
          <div className="space-y-2">
            {!credits && <p className="text-sm text-gray-500">Loading…</p>}
            {credits && credits.credits.length === 0 && <p className="flex items-center gap-1.5 text-sm text-gray-500"><Lock className="h-4 w-4" /> No verified credits yet.</p>}
            {credits?.credits.map((c) => (
              <div key={c.projectId} className="rounded-lg border border-gray-200 p-3 text-sm">
                <p className="flex items-center gap-1.5 font-semibold text-emerald-700">
                  <CheckCircle className="h-4 w-4" /> Verified Production Credit
                </p>
                <p className="font-medium text-gray-900">{c.projectName}</p>
                <p className="text-gray-600">{[c.role, c.production].filter(Boolean).join(' · ')}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'answers' && (
          <div className="space-y-3">
            {app.answers.map((answer, i) => (
              <div key={i} className="text-sm">
                <p className="mb-1 font-medium text-gray-700">{project.questions[i]}</p>
                {answer && String(answer).trim() ? <p className="text-gray-600">{answer}</p> : <p className="italic text-gray-400">Not answered</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <HireNowModal
        open={hireOpen}
        onOpenChange={setHireOpen}
        crewId={app.crew.id}
        crewName={app.crew.user.name}
        crewRoles={app.crew.primaryRoles ?? []}
        defaultProjectId={project.id}
        onSent={onHired}
      />
    </div>
  )
}
