'use client'

import { useMemo, useRef } from 'react'
import { CrewCard } from '@/components/crew/CrewCard'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface NetworkConnection {
  id: string
  connectedAt: string
  user: {
    id: string
    name: string
    email: string
    phone: string | null
    crewProfile?: {
      id?: string
      photo: string | null
      city: string | null
      primaryRoles: string[]
      yearsExperience: string | null
      location: string | null
      contactWhatsApp: string | null
      portfolioLinks: string[]
      imdbLink: string | null
    }
  }
}

interface CrewMemberLike {
  id: string
  user: {
    name: string
    email: string
    phone: string
    phoneVerified: boolean
  }
  photo: string | null
  city: string | null
  primaryRoles: string[]
  yearsExperience: string | null
  location: string | null
  availableToTravel: boolean
  availability: boolean
  availabilityStart: string | null
  availabilityEnd: string | null
  projectTypes: string[]
  dailyBudgetMin: number | null
  dailyBudgetMax: number | null
  languages: string[]
  imdbLink: string | null
  portfolioLinks: string[]
  pastProjects: Array<{ title?: string; year?: number; role?: string; link?: string | null; notes?: string | null }>
  contactWhatsApp: string | null
  subscriptionTier: string
  createdAt: string
}

interface Props {
  connections: NetworkConnection[]
}

export function NetworkCrewSlider({ connections }: Props) {
  // Only include connections where the other user is a crew with a profile
  const crewMembers: CrewMemberLike[] = useMemo(() => {
    return connections
      .filter((c) => !!c.user.crewProfile)
      .map((c) => {
        const cp = c.user.crewProfile!
        return {
          id: cp.id || c.user.id,
          user: {
            name: c.user.name,
            email: c.user.email,
            phone: c.user.phone || '',
            phoneVerified: false,
          },
          photo: cp.photo || null,
          city: cp.city || null,
          primaryRoles: cp.primaryRoles || [],
          yearsExperience: cp.yearsExperience || null,
          location: cp.location || null,
          availableToTravel: false,
          availability: true,
          availabilityStart: null,
          availabilityEnd: null,
          projectTypes: [],
          dailyBudgetMin: null,
          dailyBudgetMax: null,
          languages: [],
          imdbLink: cp.imdbLink || null,
          portfolioLinks: cp.portfolioLinks || [],
          pastProjects: [],
          contactWhatsApp: cp.contactWhatsApp || null,
          subscriptionTier: 'FREE',
          createdAt: new Date(c.connectedAt).toISOString(),
        }
      })
  }, [connections])

  const scrollerRef = useRef<HTMLDivElement>(null)

  const scrollBy = (delta: number) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: delta, behavior: 'smooth' })
  }

  if (crewMembers.length === 0) {
    return (
      <div className="text-sm text-gray-500">No network crew profiles yet.</div>
    )
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Network Profiles</h3>
        <div className="hidden md:flex gap-2">
          <Button type="button" variant="outline" size="icon" onClick={() => scrollBy(-400)} aria-label="Previous">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={() => scrollBy(400)} aria-label="Next">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scroll-smooth" ref={scrollerRef} style={{ scrollSnapType: 'x mandatory' }}>
        {crewMembers.map((m) => (
          <div key={m.id} className="min-w-[280px] max-w-[320px] flex-1 scroll-snap-align-start">
            <CrewCard crew={m as any} />
          </div>
        ))}
      </div>

      <div className="md:hidden mt-3 flex justify-center gap-4">
        <Button type="button" variant="outline" size="sm" onClick={() => scrollBy(-300)}>Prev</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => scrollBy(300)}>Next</Button>
      </div>
    </div>
  )
}
