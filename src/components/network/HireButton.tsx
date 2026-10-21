"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { useSession } from '@/lib/auth/session-context'
import { swrFetcher } from '@/lib/swr'
import { Button } from '@/components/ui/button'
import { Briefcase } from 'lucide-react'
import { HireNowModal } from '@/components/hire/HireNowModal'

interface HireButtonProps {
  crewUserId: string
  crewId: string
  crewName: string
  crewRoles?: string[]
}

type RequestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED'

export function HireButton({ crewUserId, crewId, crewName, crewRoles = [] }: HireButtonProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const isProducer = session?.user?.role === 'EMPLOYER'

  // The producer's earlier requests to this crew member (to show their status).
  const { data, mutate } = useSWR<{ requests: Array<{ id: string; status: RequestStatus; project?: { projectName: string } }> }>(
    isProducer ? `/api/hire-requests?crewId=${encodeURIComponent(crewId)}` : null,
    swrFetcher,
  )
  const requests = data?.requests ?? []

  // Hide if the viewer is the same user (crew viewing own profile), and for signed-in crew.
  if (session?.user?.id && session.user.id === crewUserId) return null
  if (session?.user?.role === 'CREW') return null

  const handleClick = () => {
    // Guests (and non-producers) are taken to producer signup, then back to this profile.
    if (!isProducer) {
      const returnUrl = typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : ''
      const returnParam = returnUrl ? `&returnUrl=${encodeURIComponent(returnUrl)}` : ''
      router.push(`/accounts?tab=signup&role=employer&intent=post-requirement${returnParam}`)
      return
    }
    setOpen(true)
  }

  return (
    <div>
      <Button onClick={handleClick} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
        <Briefcase className="h-4 w-4" />
        Hire Now
      </Button>
      {isProducer && requests.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-gray-600">
          {requests.slice(0, 3).map((r) => (
            <li key={r.id}>
              {r.project?.projectName ?? 'Project'}:{' '}
              <span className={r.status === 'ACCEPTED' ? 'font-semibold text-green-700' : r.status === 'DECLINED' ? 'font-semibold text-red-700' : 'font-semibold text-yellow-700'}>
                {r.status === 'PENDING' ? 'Request pending' : r.status === 'ACCEPTED' ? 'Hired' : r.status === 'DECLINED' ? 'Declined' : 'Cancelled'}
              </span>
            </li>
          ))}
        </ul>
      )}
      {isProducer && (
        <HireNowModal
          open={open}
          onOpenChange={setOpen}
          crewId={crewId}
          crewName={crewName}
          crewRoles={crewRoles}
          onSent={() => void mutate()}
        />
      )}
    </div>
  )
}
