'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/lib/auth/session-context'
import { Button } from '@/components/ui/button'
import { UserPlus, UserCheck, UserX, Clock } from 'lucide-react'

interface ConnectionButtonProps {
  userId: string
  currentUserId: string
  onSuccess?: () => void
}

export function ConnectionButton({ userId, currentUserId, onSuccess }: ConnectionButtonProps) {
  const { data: session } = useSession()

  const [status, setStatus] = useState<'none' | 'pending' | 'connected' | 'loading'>('none')
  const [error, setError] = useState<string | null>(null)

  const checkConnectionStatus = async () => {
    try {
      // Check if there's already a connection
      const response = await fetch('/api/network/connections')
      const data = await response.json()
      
      if (data.connections) {
        const existingConnection = data.connections.find(
          (conn: any) => conn.user.id === userId
        )
        if (existingConnection) {
          setStatus('connected')
          return
        }
      }

      // Check if there's a pending request
      const requestsResponse = await fetch('/api/network/requests')
      const requestsData = await requestsResponse.json()
      
      if (requestsData.sentRequests) {
        const pendingRequest = requestsData.sentRequests.find(
          (req: any) => req.receiver.id === userId
        )
        if (pendingRequest) {
          setStatus('pending')
          return
        }
      }

      if (requestsData.receivedRequests) {
        const receivedRequest = requestsData.receivedRequests.find(
          (req: any) => req.requester.id === userId
        )
        if (receivedRequest) {
          setStatus('pending')
          return
        }
      }
    } catch (err) {
      console.error('Error checking connection status:', err)
    }
  }

  // Check connection status on mount
  useEffect(() => {
    checkConnectionStatus()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnect = async () => {
    if (userId === currentUserId) {
      setError('Cannot connect with yourself')
      return
    }

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
        body: JSON.stringify({ receiverId: userId }),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeout)
    }

    try {
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to send connection request')
      }
      setStatus('pending')
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send request')
      setStatus('none')
    }
  }

  // Hide for self
  if (userId === currentUserId) {
    return null
  }

  // Hide entirely for logged-in employers
  if (session?.user?.role === 'EMPLOYER') {
    return null
  }

  if (status === 'connected') {
    return (
      <Button variant="outline" disabled className="gap-2">
        <UserCheck className="h-4 w-4" />
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

  return (
    <div>
      <Button
        onClick={handleConnect}
        disabled={status === 'loading'}
        className="gap-2 bg-indigo-600 hover:bg-indigo-700"
      >
        <UserPlus className="h-4 w-4" />
        {status === 'loading' ? 'Sending...' : 'Connect'}
      </Button>
      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  )
}
