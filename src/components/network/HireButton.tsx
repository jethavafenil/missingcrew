"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth/session-context'
import { Button } from '@/components/ui/button'
import { Briefcase, UserCheck as Check, Clock } from 'lucide-react'

interface HireButtonProps {
  crewUserId: string
  primaryRole?: string
}

type Status = 'none' | 'pending' | 'connected' | 'loading'

export function HireButton({ crewUserId, primaryRole }: HireButtonProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [status, setStatus] = useState<Status>('none')
  const [error, setError] = useState<string | null>(null)

  const checkConnectionStatus = async () => {
    try {
      const connectionsRes = await fetch('/api/network/connections')
      if (connectionsRes.ok) {
        const data = await connectionsRes.json()
        const existingConnection = data.connections?.find((c: any) => c.user?.id === crewUserId)
        if (existingConnection) {
          setStatus('connected')
          return
        }
      }

      const requestsRes = await fetch('/api/network/requests')
      if (requestsRes.ok) {
        const requestsData = await requestsRes.json()
        const pendingSent = requestsData.sentRequests?.find((r: any) => r.receiver?.id === crewUserId)
        const pendingReceived = requestsData.receivedRequests?.find((r: any) => r.requester?.id === crewUserId)
        if (pendingSent || pendingReceived) {
          setStatus('pending')
          return
        }
      }
    } catch (e) {
      // silent fail; show default state
      // eslint-disable-next-line no-console
      console.error('[HireButton] checkConnectionStatus error', e)
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      checkConnectionStatus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, crewUserId])

  // Hide if the viewer is the same user (crew viewing own profile)
  if (session?.user?.id && session.user.id === crewUserId) return null

  // Hide entirely for logged-in crew users
  if (session?.user?.role === 'CREW') return null

  const handleHireClick = async () => {
    try {
      // If not logged in or not employer, route to employer signup/login with intent
      if (!session?.user?.id || session.user.role !== 'EMPLOYER') {
        router.push('/accounts?tab=signup&role=employer&intent=post-requirement')
        return
      }

      if (status === 'connected' || status === 'pending') return

      setStatus('loading')
      setError(null)

      // Guard against a hung request leaving the button stuck on "Sending..."
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15_000)

      let response: Response
      try {
        response = await fetch('/api/network/request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ receiverId: crewUserId }),
          signal: controller.signal,
        })
      } finally {
        clearTimeout(timeout)
      }

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to send connection request')
      }

      setStatus('pending')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send request')
      setStatus('none')
    }
  }

  // For logged-in users, mirror ConnectionButton states
  if (session?.user?.id) {
    if (status === 'connected') {
      return (
        <Button variant="outline" disabled className="gap-2">
          <Check className="h-4 w-4" />
          Connected
        </Button>
      )
    }

    if (status === 'pending') {
      return (
        <Button variant="outline" disabled className="gap-2">
          <Clock className="h-4 w-4" />
          Request Sent
        </Button>
      )
    }
  }

  return (
    <div>
      <Button onClick={handleHireClick} disabled={status === 'loading'} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
        <Briefcase className="h-4 w-4" />
        {status === 'loading' ? 'Sending...' : 'Hire Now'}
      </Button>
      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  )
}
