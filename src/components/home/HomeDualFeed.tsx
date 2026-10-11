'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Briefcase, 
  Users, 
  MapPin, 
  Calendar, 
  ArrowRight, 
  Sparkles, 
  BadgeCheck, 
  IndianRupee, 
  Plane, 
  Clock,
  ChevronRight,
  Film
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { slugifyName } from '@/lib/utils'

export interface HomeProject {
  id: string
  projectName: string
  projectType: string
  rolesNeeded: Array<string | { role: string; count?: number }>
  shootStartDate: string
  shootEndDate: string
  location: string
  description: string
  questions?: string[]
  employer: {
    user: {
      name: string
      image?: string | null
    }
  }
  _count: {
    applications: number
  }
}

export interface HomeCrewMember {
  id: string
  user: {
    name: string
    email?: string
    image?: string | null
  }
  photo?: string | null
  city?: string | null
  location?: string | null
  primaryRoles: string[]
  yearsExperience?: string | number | null
  availableToTravel?: boolean
  availability?: boolean
  dailyBudgetMin?: number | null
  dailyBudgetMax?: number | null
  projectTypes?: string[]
  portfolioLinks?: string[]
}

interface HomeDualFeedProps {
  projects: HomeProject[]
  crew: HomeCrewMember[]
}

// Fallback high-quality demo data if database currently has few/no rows
const FALLBACK_PROJECTS: HomeProject[] = [
  {
    id: 'demo-p-1',
    projectName: 'Feature Film: "The Last Sunset"',
    projectType: 'Feature Film',
    rolesNeeded: ['Director of Photography', 'Gaffer', 'Sound Recordist'],
    shootStartDate: new Date(Date.now() + 86400000 * 14).toISOString(),
    shootEndDate: new Date(Date.now() + 86400000 * 35).toISOString(),
    location: 'Mumbai & Goa',
    description: 'Looking for an experienced core camera and lighting crew for an independent psychological drama feature.',
    employer: { user: { name: 'Kite Studios Production' } },
    _count: { applications: 6 }
  },
  {
    id: 'demo-p-2',
    projectName: 'National Brand Commercial (FMCG)',
    projectType: 'Commercial / Ad',
    rolesNeeded: ['Lighting Cameraman', 'Colorist', 'Wardrobe Stylist'],
    shootStartDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    shootEndDate: new Date(Date.now() + 86400000 * 9).toISOString(),
    location: 'Bengaluru, India',
    description: 'High-production 3-day commercial campaign for a leading beverage brand. Quick turnaround on DIT and lighting.',
    employer: { user: { name: 'Aura Media Works' } },
    _count: { applications: 12 }
  },
  {
    id: 'demo-p-3',
    projectName: 'Music Video: "Midnight Monsoon"',
    projectType: 'Music Video',
    rolesNeeded: ['Drone Pilot', 'Steadicam Operator', 'Makeup Artist'],
    shootStartDate: new Date(Date.now() + 86400000 * 20).toISOString(),
    shootEndDate: new Date(Date.now() + 86400000 * 23).toISOString(),
    location: 'Kochi & Munnar, Kerala',
    description: 'Cinematic music video shot on location across rain-soaked tea plantations. High mobility required.',
    employer: { user: { name: 'Red Horizon Records' } },
    _count: { applications: 9 }
  },
  {
    id: 'demo-p-4',
    projectName: 'Docu-Series: "Lost Culinary Heritage"',
    projectType: 'Documentary',
    rolesNeeded: ['Sound Designer', 'Second Unit Camera', 'Editor'],
    shootStartDate: new Date(Date.now() + 86400000 * 30).toISOString(),
    shootEndDate: new Date(Date.now() + 86400000 * 50).toISOString(),
    location: 'Delhi NCR & Lucknow',
    description: 'OTT docu-series capturing regional cooking traditions and heirloom recipes with raw cinematic intimacy.',
    employer: { user: { name: 'Chronicle Pictures' } },
    _count: { applications: 4 }
  }
]

const FALLBACK_CREW: HomeCrewMember[] = [
  {
    id: 'demo-c-1',
    user: { name: 'Arjun Sen' },
    primaryRoles: ['Director of Photography', 'Cinematographer'],
    city: 'Mumbai',
    yearsExperience: '8',
    availableToTravel: true,
    availability: true,
    dailyBudgetMin: 25000,
    dailyBudgetMax: 40000
  },
  {
    id: 'demo-c-2',
    user: { name: 'Meera Nambiar' },
    primaryRoles: ['Production Designer', 'Art Director'],
    city: 'Bengaluru',
    yearsExperience: '6',
    availableToTravel: true,
    availability: true,
    dailyBudgetMin: 18000,
    dailyBudgetMax: 30000
  },
  {
    id: 'demo-c-3',
    user: { name: 'Kabir Fernandes' },
    primaryRoles: ['Sound Recordist', 'Boom Operator'],
    city: 'Goa',
    yearsExperience: '10',
    availableToTravel: true,
    availability: true,
    dailyBudgetMin: 15000,
    dailyBudgetMax: 25000
  },
  {
    id: 'demo-c-4',
    user: { name: 'Tanya Deshmukh' },
    primaryRoles: ['Colorist', 'Senior Video Editor'],
    city: 'Pune',
    yearsExperience: '7',
    availableToTravel: false,
    availability: true,
    dailyBudgetMin: 20000,
    dailyBudgetMax: 35000
  }
]

export function HomeDualFeed({ projects, crew }: HomeDualFeedProps) {
  // Mobile tab state: 'projects' | 'crew' (on desktop both are rendered side-by-side)
  const [mobileTab, setMobileTab] = useState<'projects' | 'crew'>('projects')

  const displayProjects = projects && projects.length > 0 ? projects.slice(0, 4) : FALLBACK_PROJECTS
  const displayCrew = crew && crew.length > 0 ? crew.slice(0, 4) : FALLBACK_CREW

  const formatDate = (isoString?: string) => {
    if (!isoString) return ''
    try {
      const d = new Date(isoString)
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch {
      return ''
    }
  }

  const formatBudget = (min?: number | null, max?: number | null) => {
    if (min && max) {
      return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}/day`
    }
    if (min) return `From ₹${min.toLocaleString()}/day`
    if (max) return `Up to ₹${max.toLocaleString()}/day`
    return 'Rate Flexible'
  }

  const getRoleName = (roleItem: string | { role: string; count?: number }): string => {
    if (typeof roleItem === 'string') return roleItem
    return roleItem?.role || 'Crew'
  }

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-white via-indigo-50/30 to-purple-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100/80 border border-indigo-200/60 text-indigo-800 text-xs md:text-sm font-semibold mb-3 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Live Marketplace Feed
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
            Recent Projects & Standout Film Crew
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-gray-600">
            Connecting real film productions with vetted talent. Browse active hiring calls on the left and discover standout professionals on the right.
          </p>
        </div>

        {/* Mobile View Toggle (visible only below lg screens) */}
        <div className="flex lg:hidden justify-center mb-6">
          <div className="inline-flex p-1 bg-gray-100/90 rounded-xl border border-gray-200 shadow-inner">
            <button
              type="button"
              onClick={() => setMobileTab('projects')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                mobileTab === 'projects'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Recent Projects ({displayProjects.length})
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('crew')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                mobileTab === 'crew'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4" />
              Standout Crew ({displayCrew.length})
            </button>
          </div>
        </div>

        {/* 2-Column Desktop Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start">
          
          {/* ========================================================= */}
          {/* LEFT COLUMN: RECENT POSTED PROJECTS                       */}
          {/* ========================================================= */}
          <div className={`${mobileTab === 'projects' ? 'block' : 'hidden lg:block'} space-y-4`}>
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
                    Recent Projects
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Hiring Now
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500">Active productions looking for crew</p>
                </div>
              </div>
              <Link 
                href="/find-work" 
                className="inline-flex items-center gap-1 text-xs md:text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors group"
              >
                Browse all
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Project Cards List */}
            <div className="space-y-4">
              {displayProjects.map((project) => {
                const startStr = formatDate(project.shootStartDate)
                const endStr = formatDate(project.shootEndDate)
                const dateText = startStr && endStr ? `${startStr} – ${endStr}` : startStr || 'Dates flexible'
                const roles = (project.rolesNeeded || []).slice(0, 3)
                const remainingRolesCount = Math.max(0, (project.rolesNeeded?.length || 0) - 3)

                return (
                  <div
                    key={project.id}
                    className="group relative bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:shadow-lg hover:border-indigo-300 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Meta: Production & Type */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="h-6 w-6 rounded-md bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200/50">
                            {project.employer?.user?.image ? (
                              <AvatarImage src={project.employer.user.image} alt={project.employer.user.name} />
                            ) : null}
                            <AvatarFallback className="rounded-md">
                              {project.employer?.user?.name?.slice(0, 1).toUpperCase() || 'P'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium text-gray-600 truncate">
                            {project.employer?.user?.name || 'Production House'}
                          </span>
                        </div>

                        <Badge 
                          variant="outline" 
                          className="text-[11px] font-semibold border-indigo-200 bg-indigo-50/60 text-indigo-700 shrink-0"
                        >
                          {project.projectType || 'Film Project'}
                        </Badge>
                      </div>

                      {/* Project Title */}
                      <Link 
                        href={`/projects/${project.id}`} 
                        className="block group-hover:text-indigo-600 transition-colors"
                      >
                        <h4 className="text-base sm:text-lg font-bold text-gray-900 line-clamp-1">
                          {project.projectName}
                        </h4>
                      </Link>

                      {/* Description snippet */}
                      {project.description && (
                        <p className="mt-1 text-xs text-gray-500 line-clamp-2 leading-relaxed">
                          {project.description}
                        </p>
                      )}

                      {/* Roles Needed Pills */}
                      <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[11px] font-semibold text-gray-400 mr-0.5">Roles:</span>
                        {roles.map((r, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-200/70"
                          >
                            {getRoleName(r)}
                          </span>
                        ))}
                        {remainingRolesCount > 0 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
                            +{remainingRolesCount} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Details Footer */}
                    <div className="mt-4 pt-3.5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
                      <div className="flex items-center gap-3">
                        {project.location && (
                          <span className="inline-flex items-center gap-1 font-medium text-gray-600">
                            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                            {project.location}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                          {dateText}
                        </span>
                      </div>

                      <Link
                        href={`/projects/${project.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100/80 px-3 py-1.5 rounded-lg transition-all"
                      >
                        Apply / Details
                        <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bottom link to view more */}
            <div className="pt-2 text-center">
              <Link href="/find-work">
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold text-xs sm:text-sm rounded-xl py-2 px-6"
                >
                  Explore All Open Projects ({projects.length > 0 ? projects.length : '20+'})
                </Button>
              </Link>
            </div>
          </div>


          {/* ========================================================= */}
          {/* RIGHT COLUMN: STANDOUT CREW PROFILES                      */}
          {/* ========================================================= */}
          <div className={`${mobileTab === 'crew' ? 'block' : 'hidden lg:block'} space-y-4`}>
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
                    Standout Film Crew
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                      Verified
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500">Top talent ready for production hire</p>
                </div>
              </div>
              <Link 
                href="/browse-crew" 
                className="inline-flex items-center gap-1 text-xs md:text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors group"
              >
                Browse all
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Crew Cards List */}
            <div className="space-y-4">
              {displayCrew.map((member) => {
                const name = member.user?.name || 'Film Professional'
                const profileSlug = slugifyName(name)
                const locationText = member.city || member.location || 'India'
                const roles = (member.primaryRoles || []).slice(0, 3)
                const rateText = formatBudget(member.dailyBudgetMin, member.dailyBudgetMax)

                return (
                  <div
                    key={member.id}
                    className="group relative bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:shadow-lg hover:border-purple-300 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header: Avatar + Name + Availability */}
                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            <Avatar className="h-12 w-12 rounded-xl border border-purple-200/70 shadow-xs">
                              {member.photo || member.user?.image ? (
                                <AvatarImage 
                                  src={member.photo || member.user?.image || ''} 
                                  alt={name} 
                                  className="object-cover"
                                />
                              ) : null}
                              <AvatarFallback className="rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-800 font-bold text-base">
                                {name.slice(0, 1).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {/* Active availability badge indicator */}
                            <span 
                              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs" 
                              title="Available for projects" 
                            />
                          </div>

                          <div className="min-w-0">
                            <Link 
                              href={`/crew/${profileSlug}`}
                              className="font-bold text-gray-900 text-base group-hover:text-purple-600 transition-colors flex items-center gap-1.5"
                            >
                              <span className="truncate">{name}</span>
                              <BadgeCheck className="w-4 h-4 text-purple-600 shrink-0" />
                            </Link>
                            <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                              <span className="inline-flex items-center gap-0.5">
                                <MapPin className="w-3 h-3 text-purple-500" />
                                {locationText}
                              </span>
                              {member.availableToTravel && (
                                <span className="inline-flex items-center gap-0.5 text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded text-[10px] font-medium border border-purple-100">
                                  <Plane className="w-2.5 h-2.5" />
                                  Can Travel
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Experience Badge */}
                        {member.yearsExperience && (
                          <Badge 
                            variant="secondary" 
                            className="bg-purple-50 text-purple-700 border-purple-200 text-[11px] font-semibold shrink-0"
                          >
                            {member.yearsExperience}+ yrs exp
                          </Badge>
                        )}
                      </div>

                      {/* Primary Roles Pills */}
                      <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                        {roles.map((r, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-800 border border-purple-200/60"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Details Footer */}
                    <div className="mt-4 pt-3.5 border-t border-gray-100 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1 text-gray-600 font-medium">
                        <IndianRupee className="w-3.5 h-3.5 text-purple-600" />
                        <span className="text-gray-900 font-semibold">{rateText}</span>
                      </div>

                      <Link
                        href={`/crew/${profileSlug}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 group-hover:text-purple-700 bg-purple-50/70 hover:bg-purple-100/80 px-3 py-1.5 rounded-lg transition-all"
                      >
                        View Profile
                        <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bottom link to view more */}
            <div className="pt-2 text-center">
              <Link href="/browse-crew">
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold text-xs sm:text-sm rounded-xl py-2 px-6"
                >
                  Explore All Film Crew ({crew.length > 0 ? crew.length : '1,200+'})
                </Button>
              </Link>
            </div>
          </div>

        </div>

        {/* Dual CTA Banner at bottom of the section */}
        <div className="mt-12 bg-white rounded-2xl border border-indigo-100/80 p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-bold text-gray-900">
                Ready to find work or hire film talent?
              </h4>
              <p className="text-xs sm:text-sm text-gray-600">
                Create a free account in 2 minutes. No hidden fees to post a project or join as crew.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <Link href="/accounts?tab=signup&role=employer" className="w-full sm:w-auto">
              <Button 
                variant="outline" 
                className="w-full sm:w-auto border-indigo-600 text-indigo-700 hover:bg-indigo-50 font-semibold rounded-xl text-xs sm:text-sm"
              >
                Post a Project
              </Button>
            </Link>
            <Link href="/accounts?tab=signup&role=crew" className="w-full sm:w-auto">
              <Button 
                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-sm"
              >
                Join as Crew Member
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </section>
  )
}
