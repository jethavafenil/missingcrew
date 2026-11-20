'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useSession } from '@/lib/auth/session-context'
import { swrFetcher } from '@/lib/swr'
import { buildHireMessage } from '@/lib/shareMessages'
import { formatShootRange } from '@/lib/projects/format'
import { MAX_HIRE_ALL, MAX_HIRE_MESSAGE } from '@/lib/hire/schema'
import { cleanOffer, offerError, type OfferTerms } from '@/lib/hire/offer'
import { OfferTermsFields, OfferSummary } from '@/components/hire/OfferTermsFields'

interface ProjectOption {
  id: string
  projectName: string
  location: string
  shootStartDate: string | null
  shootEndDate: string | null
  productionHouse: string | null
  projectCode?: string | null
}

interface Result {
  crewId: string
  name: string | null
  ok: boolean
  error?: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  crew: Array<{ id: string; name: string }>
  onDone?: () => void
}

const fieldClass =
  'block w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'

// HIRE ALL: one project and one message for everyone picked from the bucket list.
// "{name}" in the message becomes each person's first name on the server.
export function HireAllModal({ open, onOpenChange, crew, onDone }: Props) {
  const { data: session } = useSession()
  const { data, isLoading } = useSWR<{ projects: ProjectOption[] }>(open ? '/api/employer/projects/options' : null, swrFetcher)
  const projects = data?.projects ?? []
  const [projectId, setProjectId] = useState('')
  const [message, setMessage] = useState('')
  const [edited, setEdited] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState<Result[] | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [offer, setOffer] = useState<OfferTerms>({})
  const initialised = useRef(false)

  useEffect(() => {
    if (open && projects.length > 0 && !initialised.current) {
      initialised.current = true
      setProjectId(projects[0].id)
    }
  }, [open, projects])

  const project = projects.find((p) => p.id === projectId)
  const premade = useMemo(
    () =>
      buildHireMessage({
        crewName: '{name}',
        producerName: session?.user?.name || 'a producer',
        productionHouse: project?.productionHouse,
        projectName: project?.projectName,
        city: project?.location,
        dates: project && (project.shootStartDate || project.shootEndDate) ? formatShootRange(project.shootStartDate, project.shootEndDate) : null,
      }),
    [session?.user?.name, project],
  )
  useEffect(() => {
    if (!edited) setMessage(premade)
  }, [premade, edited])

  const reset = () => {
    setError('')
    setResults(null)
    setConfirming(false)
    setEdited(false)
    setOffer({})
    initialised.current = false
    setProjectId('')
  }

  const review = (e: React.FormEvent) => {
    e.preventDefault()
    if (!project) return setError('Please choose a project first')
    const problem = offerError(offer)
    if (problem) return setError(problem)
    setError('')
    setConfirming(true)
  }

  const submit = async () => {
    if (!project) return
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/hire-requests/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, crewIds: crew.map((c) => c.id), message, offer: cleanOffer(offer) ?? undefined }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'Could not send the requests. Please try again.')
      setConfirming(false)
      setResults(body.results as Result[])
      onDone?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the requests.')
    } finally {
      setSending(false)
    }
  }

  const sent = results?.filter((r) => r.ok).length ?? 0

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-h-[88vh] w-[94vw] max-w-lg overflow-y-auto p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle>Hire {crew.length} {crew.length === 1 ? 'person' : 'people'}</DialogTitle>
        </DialogHeader>

        {results ? (
          <div className="space-y-4 py-2">
            <p className="text-center text-lg font-semibold text-green-700">
              {sent} of {results.length} request{results.length === 1 ? '' : 's'} sent
            </p>
            <ul className="space-y-1.5 text-sm">
              {results.map((r) => (
                <li key={r.crewId} className={r.ok ? 'text-gray-700' : 'text-red-700'}>
                  {r.ok ? '✓' : '✕'} {r.name ?? 'Crew member'}
                  {!r.ok && <span className="text-gray-500"> — {r.error}</span>}
                </li>
              ))}
            </ul>
            <p className="text-center text-xs text-gray-500">Each person gets a notification and an email, and answers from their dashboard.</p>
            <Button onClick={() => onOpenChange(false)} className="w-full">Done</Button>
          </div>
        ) : isLoading ? (
          <p className="py-6 text-center text-sm text-gray-500">Loading your projects…</p>
        ) : projects.length === 0 ? (
          <div className="space-y-4 py-2 text-center">
            <p className="text-sm text-gray-600">You need an open project to hire for. Post one first, then come back.</p>
            <Link href="/employer/post-requirement" className="inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700">
              Post a project
            </Link>
          </div>
        ) : crew.length > MAX_HIRE_ALL ? (
          <p className="py-4 text-sm text-red-700">You can hire up to {MAX_HIRE_ALL} people at once. Untick a few and try again.</p>
        ) : confirming && project ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="font-semibold text-emerald-900">
                This will send an agreement to {crew.length === 1 ? 'the crew member' : `each of the ${crew.length} crew members`}.
              </p>
              <p className="mt-1 text-sm text-emerald-800">
                Each person is asked to accept. When they do, the project officially starts for them and their agreement is signed.
              </p>
            </div>
            <p className="text-sm text-gray-700">
              <span className="font-medium">{project.projectName}</span>
              {project.projectCode ? ` (${project.projectCode})` : ''}: {crew.map((c) => c.name).join(', ')}
            </p>
            <div className="max-h-56 overflow-y-auto">
              <OfferSummary offer={offer} />
            </div>
            {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" disabled={sending} onClick={() => setConfirming(false)}>
                Back
              </Button>
              <Button type="button" disabled={sending} onClick={submit} className="bg-emerald-600 hover:bg-emerald-700">
                {sending ? 'Sending…' : `Yes, send ${crew.length === 1 ? 'agreement' : 'agreements'}`}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={review} className="space-y-4">
            <p className="text-sm text-gray-600">{crew.map((c) => c.name).join(', ')}</p>
            <div>
              <label htmlFor="hall-project" className="mb-1 block text-sm font-semibold text-gray-700">Project</label>
              <select id="hall-project" value={projectId} onChange={(e) => setProjectId(e.target.value)} className={fieldClass} required>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.projectName}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="hall-message" className="mb-1 block text-sm font-semibold text-gray-700">
                Message <span className="font-normal text-gray-400">({'{name}'} becomes each person&apos;s first name)</span>
              </label>
              <textarea
                id="hall-message"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value)
                  setEdited(true)
                }}
                rows={6}
                maxLength={MAX_HIRE_MESSAGE}
                required
                className={`${fieldClass} resize-y`}
              />
              <p className="mt-1 text-right text-xs text-gray-400">{message.length}/{MAX_HIRE_MESSAGE}</p>
            </div>
            <OfferTermsFields value={offer} onChange={setOffer} idPrefix="hall-offer" forEveryone={crew.length > 1} />
            {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <Button type="submit" disabled={!message.trim()} className="h-12 w-full bg-emerald-600 text-base hover:bg-emerald-700">
              Continue
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
