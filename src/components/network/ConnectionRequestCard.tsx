'use client'

// buildCrewSlug was removed; link directly by ID to match routing


import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { UserCheck, UserX } from 'lucide-react'
import Link from 'next/link'
import { slugifyName } from '@/lib/utils'

interface ConnectionRequest {
  id: string
  createdAt: string
  requester: {
    id: string
    name: string
    email: string
    crewProfile?: {
      id?: string
      photo: string | null
      city: string | null
      primaryRoles: string[]
      yearsExperience: string | null
    }
  }
}

interface ConnectionRequestCardProps {
  request: ConnectionRequest
  onRespond: () => void
}

export function ConnectionRequestCard({ request, onRespond }: ConnectionRequestCardProps) {
  const [responding, setResponding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRespond = async (action: 'accept' | 'reject') => {
    setResponding(true)
    setError(null)

    try {
      const response = await fetch('/api/network/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectionId: request.id,
          action,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to respond to request')
      }

      onRespond()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to respond')
    } finally {
      setResponding(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Link href={`/crew/${slugifyName(request.requester.name)}`}>
            <Avatar className="h-16 w-16">
              <AvatarImage src={request.requester.crewProfile?.photo || ''} alt={request.requester.name} />
              <AvatarFallback>
                {request.requester.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1">
            <Link href={`/crew/${slugifyName(request.requester.name)}`} className="hover:underline">
              <h4 className="font-semibold text-lg">{request.requester.name}</h4>
            </Link>
            
            {request.requester.crewProfile?.primaryRoles && request.requester.crewProfile.primaryRoles.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {request.requester.crewProfile.primaryRoles.slice(0, 2).map((role, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {role}
                  </Badge>
                ))}
              </div>
            )}

            {request.requester.crewProfile?.city && (
              <p className="text-sm text-gray-500 mt-1">
                {request.requester.crewProfile.city}
              </p>
            )}

            {request.requester.crewProfile?.yearsExperience && (
              <p className="text-sm text-gray-500">
                {request.requester.crewProfile.yearsExperience}
              </p>
            )}

            <p className="text-xs text-gray-400 mt-2">
              Sent {new Date(request.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => handleRespond('accept')}
              disabled={responding}
              className="gap-1 bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <UserCheck className="h-4 w-4" />
              Accept
            </Button>
            <Button
              onClick={() => handleRespond('reject')}
              disabled={responding}
              variant="outline"
              size="sm"
              className="gap-1"
            >
              <UserX className="h-4 w-4" />
              Reject
            </Button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 mt-2">{error}</p>
        )}
      </CardContent>
    </Card>
  )
}
