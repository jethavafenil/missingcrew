'use client'

import { useEffect, useState } from 'react'
import { NetworkCrewSlider } from '@/components/network/NetworkCrewSlider'

interface CrewNetworkSectionProps {
  crewUserId: string
}

export function CrewNetworkSection({ crewUserId }: CrewNetworkSectionProps) {
  const [connections, setConnections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const fetchConnections = async () => {
      try {
        setLoading(true)
        setError(null)
        // Public endpoint for viewing the network of the profile owner
        const res = await fetch(`/api/network/user/${crewUserId}/connections`)
        if (!res.ok) {
          throw new Error('Failed to load connections')
        }
        const data = await res.json()
        if (active) setConnections(data.connections || [])
      } catch (e: any) {
        if (active) setError(e.message || 'Failed to load connections')
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchConnections()
    return () => { active = false }
  }, [crewUserId])

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-600">Loading network...</div>
    )
  }
  if (error) {
    return (
      <div className="p-6 text-center text-red-600">{error}</div>
    )
  }
  return (
    <div className="mt-8">
      <NetworkCrewSlider connections={connections} />
    </div>
  )
}
