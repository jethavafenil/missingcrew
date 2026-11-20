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
import { MAX_HIRE_MESSAGE } from '@/lib/hire/schema'
import { cleanOffer, offerError, type OfferTerms } from '@/lib/hire/offer'
import { OfferTermsFields, OfferSummary } from '@/components/hire/OfferTermsFields'

interface ProjectOption {
  id: string
  projectName: string
  projectType: string
  rolesNeeded: string[]
  location: string
  shootStartDate: string | null
  shootEndDate: string | null
  productionHouse: string | null
  projectCode?: string | null
}

interface HireNowModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  crewId: string
  crewName: string
  crewRoles: string[]
  // preselect this project (hiring an applicant from the review screen)
  defaultProjectId?: string
  onSent?: () => void
}

const fieldClass =
  'block w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'

export function HireNowModal({ open, onOpenChange, crewId, crewName, crewRoles, defaultProjectId, onSent }: HireNowModalProps) {
  const { data: session } = useSession()
  const { data, isLoading } = useSWR<{ projects: ProjectOption[] }>(open ? '/api/employer/projects/options' : null, swrFetcher)
  const projects = data?.projects ?? []

  const [projectId, setProjectId] = useState('')
  const [role, setRole] = useState('')
  const [message, setMessage] = useState('')
  const [edited, setEdited] = useState(false)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  // second step: "This will send an agreement to the crew member" - confirm before anything is sent
  const [confirming, setConfirming] = useState(false)
  const [offer, setOffer] = useState<OfferTerms>({})
  const initialised = useRef(false)

  const project = projects.find((p) => p.id === projectId)

  // Pre-select the only / first project once the list arrives.
  useEffect(() => {
    if (open && projects.length > 0 && !projectId && !initialised.current) {
      initialised.current = true
      setProjectId(projects.find((p) => p.id === defaultProjectId)?.id ?? projects[0].id)
    }
  }, [open, projects, projectId, defaultProjectId])

  // Roles to choose from: what the project needs first, then the crew member's own roles.
  const roleOptions = useMemo(() => {
    const list = [...(project?.rolesNeeded ?? []), ...crewRoles]
    return Array.from(new Set(list.filter(Boolean)))
  }, [project, crewRoles])

  useEffect(() => {
    if (roleOptions.length > 0 && !roleOptions.includes(role)) setRole(roleOptions[0])
  }, [roleOptions, role])

  // The premade message follows the choices until the producer starts editing it.
  const premade = useMemo(
    () =>
      buildHireMessage({
        crewName,
        producerName: session?.user?.name || 'a producer',
        productionHouse: project?.productionHouse,
        projectName: project?.projectName,
        city: project?.location,
        dates: project && (project.shootStartDate || project.shootEndDate) ? formatShootRange(project.shootStartDate, project.shootEndDate) : null,
        role: role || null,
      }),
    [crewName, session?.user?.name, project, role],
  )
  useEffect(() => {
    if (!edited) setMessage(premade)
  }, [premade, edited])

  const reset = () => {
    setError('')
    setSent(false)
    setConfirming(false)
    setEdited(false)
    setOffer({})
    initialised.current = false
    setProjectId('')
  }

  // Step 1: the form only asks for confirmation.
  const review = (e: React.FormEvent) => {
    e.preventDefault()
    if (!project) {
      setError('Please choose a project first')
      return
    }
    const problem = offerError(offer)
    if (problem) {
      setError(problem)
      return
    }
    setError('')
    setConfirming(true)
  }

  // Step 2: the producer confirmed, send it.
  const submit = async () => {
    if (!project) return
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/hire-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crewId, projectId: project.id, role: role || undefined, message, offer: cleanOffer(offer) ?? undefined }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'Could not send the request. Please try again.')
      setConfirming(false)
      setSent(true)
      onSent?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the request.')
    } finally {
      setSending(false)
    }
  }

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
          <DialogTitle>Hire {crewName}</DialogTitle>
        </DialogHeader>

        {sent ? (
          <div className="space-y-4 py-2 text-center">
            <p className="text-lg font-semibold text-green-700">Request sent!</p>
            <p className="text-sm text-gray-600">
              {crewName} will get a notification and an email. When they accept, the agreement is signed and you will be told.
            </p>
            <Button onClick={() => onOpenChange(false)} className="w-full">Done</Button>
          </div>
        ) : isLoading ? (
          <p className="py-6 text-center text-sm text-gray-500">Loading your projects…</p>
        ) : projects.length === 0 ? (
          <div className="space-y-4 py-2 text-center">
            <p className="text-sm text-gray-600">You need an open project to hire for. Post one first, then come back to this profile.</p>
            <Link
              href="/employer/post-requirement"
              className="inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Post a project
            </Link>
          </div>
        ) : confirming && project ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="font-semibold text-emerald-900">This will send an agreement to the crew member.</p>
              <p className="mt-1 text-sm text-emerald-800">
                {crewName} will be asked to accept it. Once they do, the project officially starts and the agreement is signed by both of you.
              </p>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-gray-500">Project</dt>
              <dd className="font-medium text-gray-900">{project.projectName}{project.projectCode ? ` (${project.projectCode})` : ''}</dd>
              <dt className="text-gray-500">Role</dt>
              <dd className="font-medium text-gray-900">{role || 'To be agreed'}</dd>
            </dl>
            <div className="max-h-56 overflow-y-auto">
              <OfferSummary offer={offer} />
            </div>
            {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" disabled={sending} onClick={() => setConfirming(false)}>
                Back
              </Button>
              <Button type="button" disabled={sending} onClick={submit} className="bg-emerald-600 hover:bg-emerald-700">
                {sending ? 'Sending…' : 'Yes, send agreement'}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={review} className="space-y-4">
            <div>
              <label htmlFor="hire-project" className="mb-1 block text-sm font-semibold text-gray-700">Project</label>
              <select id="hire-project" value={projectId} onChange={(e) => setProjectId(e.target.value)} className={fieldClass} required>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.projectName}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="hire-role" className="mb-1 block text-sm font-semibold text-gray-700">Role</label>
              <select id="hire-role" value={role} onChange={(e) => setRole(e.target.value)} className={fieldClass}>
                {roleOptions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="hire-message" className="mb-1 block text-sm font-semibold text-gray-700">
                Message <span className="font-normal text-gray-400">(edit it if you like)</span>
              </label>
              <textarea
                id="hire-message"
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

            <OfferTermsFields value={offer} onChange={setOffer} idPrefix="hire-offer" />

            {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

            <Button type="submit" disabled={!message.trim()} className="h-12 w-full bg-emerald-600 text-base hover:bg-emerald-700">
              Continue
            </Button>
            <p className="text-center text-xs text-gray-500">You will be asked to confirm before anything is sent.</p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
