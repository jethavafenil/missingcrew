'use client'

import { useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { swrFetcher } from '@/lib/swr'
import { formatShootRange } from '@/lib/projects/format'
import { slugifyName } from '@/lib/utils'

type Status = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED'

interface CrewViewRequest {
  id: string
  status: Status
  role: string | null
  message: string
  createdAt: string
  producerName: string
  project?: { id: string; projectName: string; location: string; shootStartDate: string | null; shootEndDate: string | null; productionHouse: string | null }
}

interface EmployerViewRequest {
  id: string
  status: Status
  role: string | null
  message: string
  createdAt: string
  crew?: { id: string; name: string; primaryRoles: string[] }
  project?: { id: string; projectName: string }
}

const STATUS_STYLE: Record<Status, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  ACCEPTED: 'bg-green-100 text-green-800 hover:bg-green-100',
  DECLINED: 'bg-red-100 text-red-800 hover:bg-red-100',
  CANCELLED: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
}
const STATUS_LABEL: Record<Status, string> = { PENDING: 'Pending', ACCEPTED: 'Accepted', DECLINED: 'Declined', CANCELLED: 'Cancelled' }

export function HireRequestsPanel({ viewer }: { viewer: 'CREW' | 'EMPLOYER' }) {
  const { data, isLoading, mutate } = useSWR<{ requests: Array<CrewViewRequest | EmployerViewRequest> }>('/api/hire-requests', swrFetcher, {
    revalidateOnFocus: true,
  })
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const requests = data?.requests ?? []

  const answer = async (id: string, status: 'ACCEPTED' | 'DECLINED' | 'CANCELLED') => {
    setBusyId(id)
    setError('')
    try {
      const res = await fetch(`/api/hire-requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'Could not update the request')
      await mutate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the request')
      await mutate()
    } finally {
      setBusyId(null)
    }
  }

  if (isLoading) return <p className="py-8 text-center text-sm text-gray-500">Loading hire requests…</p>

  if (requests.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="font-medium text-gray-900 dark:text-white">No hire requests yet</p>
        <p className="mt-1 text-sm text-gray-500">
          {viewer === 'CREW'
            ? 'When a producer wants to hire you, the request will appear here.'
            : 'Open a crew profile and press Hire Now to send your first request.'}
        </p>
        {viewer === 'EMPLOYER' && (
          <Link href="/browse-crew" className="mt-4 inline-flex rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Browse crew
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {requests.map((r) => {
        const busy = busyId === r.id
        if (viewer === 'CREW') {
          const c = r as CrewViewRequest
          return (
            <div key={c.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{c.producerName}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {c.project?.projectName}
                    {c.role ? ` · ${c.role}` : ''}
                  </p>
                  {c.project && (
                    <p className="text-xs text-gray-500">
                      {c.project.location} · {formatShootRange(c.project.shootStartDate, c.project.shootEndDate)}
                      {c.project.productionHouse ? ` · ${c.project.productionHouse}` : ''}
                    </p>
                  )}
                </div>
                <Badge className={STATUS_STYLE[c.status]}>{STATUS_LABEL[c.status]}</Badge>
              </div>
              <p className="mt-3 whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200">{c.message}</p>
              {c.status === 'PENDING' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" disabled={busy} onClick={() => answer(c.id, 'ACCEPTED')} className="bg-emerald-600 hover:bg-emerald-700">
                    Accept
                  </Button>
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => answer(c.id, 'DECLINED')}>
                    Decline
                  </Button>
                </div>
              )}
            </div>
          )
        }
        const e = r as EmployerViewRequest
        return (
          <div key={e.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                {e.crew ? (
                  <Link href={`/crew/${slugifyName(e.crew.name)}`} className="font-semibold text-indigo-700 hover:underline">
                    {e.crew.name}
                  </Link>
                ) : (
                  <p className="font-semibold">Crew member</p>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {e.project?.projectName}
                  {e.role ? ` · ${e.role}` : ''}
                </p>
              </div>
              <Badge className={STATUS_STYLE[e.status]}>{STATUS_LABEL[e.status]}</Badge>
            </div>
            <p className="mt-3 whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200">{e.message}</p>
            {e.status === 'PENDING' && (
              <div className="mt-3">
                <Button size="sm" variant="outline" disabled={busy} onClick={() => answer(e.id, 'CANCELLED')}>
                  Cancel request
                </Button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
