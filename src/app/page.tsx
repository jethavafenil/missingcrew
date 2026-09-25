import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { departments } from '@/lib/departments'
import { ProjectCardWrapper } from '@/components/projects/ProjectCardWrapper'
import { CrewSlider } from '@/components/crew/CrewSlider'
import { FallbackCrewSlider } from '@/components/crew/FallbackCrewSlider'
import { slugifyName } from '@/lib/utils'
import AnonymousRoleToggle from '@/components/AnonymousRoleToggle'
import { getFeaturedCrew, getFeaturedProjects } from '@/lib/cache/public'

// No page-level revalidate: the root layout resolves the session per request,
// so this route renders dynamically. Featured data is still cached via
// unstable_cache in lib/cache/public.

interface Project {
  id: string
  projectName: string
  projectType: string
  rolesNeeded: Array<string | { role: string, count?: number }>
  shootStartDate: string
  shootEndDate: string
  location: string
  description: string
  questions: string[]
  employer: {
    user: {
      name: string
    }
  }
  _count: {
    applications: number
  }
}

export default async function Home() {
  // Load featured projects and crew
  let projects: Project[] = []
  let crew: any[] = []

  try {
    // Fetch latest open projects (newest first)
    const dbProjects = await getFeaturedProjects()

    type RawProject = any
    projects = dbProjects.map((project: RawProject) => {
      let rolesNeeded: unknown[] = []
      const rawRoles = (project as any).rolesNeeded
      if (Array.isArray(rawRoles)) rolesNeeded = rawRoles
      else if (typeof rawRoles === 'string') { try { rolesNeeded = JSON.parse(rawRoles) } catch {} }
      let questions: unknown[] = []
      const rawQuestions = (project as any).questions
      if (Array.isArray(rawQuestions)) questions = rawQuestions
      else if (typeof rawQuestions === 'string') { try { questions = JSON.parse(rawQuestions) } catch {} }
      const shootStart = (project as any).shootStartDate
      const shootEnd = (project as any).shootEndDate
      return {
        id: String((project as any).id ?? ''),
        projectName: String((project as any).projectName ?? ''),
        projectType: String((project as any).projectType ?? ''),
        rolesNeeded: (rolesNeeded as any[]) || [],
        shootStartDate: shootStart ? new Date(shootStart as any).toISOString() : '',
        shootEndDate: shootEnd ? new Date(shootEnd as any).toISOString() : '',
        location: String((project as any).location ?? ''),
        description: String((project as any).description ?? ''),
        questions: (questions as string[]) || [],
        employer: { user: { name: String((project as any).employer?.user?.name ?? '') } },
        _count: { applications: Number((project as any)._count?.applications ?? 0) },
      } as Project
    })

    const dbCrew = await getFeaturedCrew()
    crew = dbCrew
  } catch (err) {
    console.error('Error loading home data:', err)
  }

  // Popular roles from departments
  const popularRoles = Array.from(new Set(
    departments.flatMap(d => d.roles.slice(0, 3))
  )).slice(0, 12)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-800 via-purple-800 to-blue-700 text-white">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full bg-indigo-500/20 blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute top-1/3 -right-16 w-80 h-80 rounded-full bg-purple-500/20 blur-3xl animate-blob animation-delay-4000" />
          <div className="absolute -bottom-10 left-1/3 w-56 h-56 rounded-full bg-blue-500/20 blur-2xl animate-blob animation-delay-6000" />
        </div>
        <div className="relative container mx-auto px-4 py-6 md:py-8 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex w-full justify-center items-center mb-4 md:mb-3">
              {/* Show role toggle only for anonymous users */}
              <AnonymousRoleToggle initialActive="crew" />
            </div>
            <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-indigo-100 text-xs md:text-sm mb-4 md:mb-3">
              For Crew Members
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight px-2">
              Find Consistent Work. Build Your Film Career.
            </h1>
            <p className="mt-4 md:mt-3 text-base md:text-lg text-indigo-100 max-w-2xl mx-auto px-4">
              Discover verified opportunities, showcase your portfolio, and get hired by top production houses.
            </p>
            {/* Stats section - now with glassmorphism effect and responsive layout */}
            <div className="mt-8 md:mt-10 lg:mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 lg:gap-8 max-w-4xl mx-auto animate-fade-in-up animation-delay-1500 px-2">
              {[
                { value: "1,200+", label: "Talented Crew Members" },
                { value: "450+", label: "Projects Completed" },
                { value: "180+", label: "Production Companies" }
              ].map((stat, index) => (
                <div
                  key={index}
                  className="text-center p-4 md:p-5 lg:p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 md:mb-3">{stat.value}</div>
                  <div className="text-xs sm:text-sm md:text-base text-indigo-100">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-8 md:py-12 bg-gradient-to-b from-white to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4 px-2">Why Crew Choose MissingCrew</h2>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-4">Everything you need to accelerate your film career and connect with industry-leading opportunities</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {[
              {
                title: 'Verified Opportunities',
                desc: 'Access fresh, legitimate projects from verified employers. Every opportunity is vetted to ensure you\'re connecting with real production companies.',
                icon: '✓'
              },
              {
                title: 'Standout Profiles',
                desc: 'Showcase your best work with a portfolio designed for film professionals. Feature projects, reels, credits, and achievements beautifully.',
                icon: '★'
              },
              {
                title: 'Smart Matching',
                desc: 'Get discovered by the right employers based on your skills, day rates, location, and availability. Let opportunities find you.',
                icon: '⚡'
              }
            ].map((item, i) => (
              <Card key={i} className="shadow-lg border-gray-200 hover:shadow-xl transition-shadow duration-300 bg-white">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                    <span className="text-2xl text-indigo-600">{item.icon}</span>
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Logos */}
      <section className="py-6 md:py-8 bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center text-white/90 font-medium mb-5 md:mb-6 lg:mb-8 text-xs md:text-sm lg:text-base px-2">Trusted by teams hiring across film, TV, and digital</div>
          
          {/* Infinite Scrolling Logos */}
          <div className="relative bg-white/10 backdrop-blur-md rounded-xl md:rounded-2xl py-5 md:py-6 lg:py-8 shadow-lg border border-white/20">
            <div className="flex animate-scroll">
              {/* First set of logos */}
              {[
                "/studio_logos/628aef2de771811b441e.png",
                "/studio_logos/download.svg",
                "/studio_logos/download (1).svg",
                "/studio_logos/download (2).svg",
                "/studio_logos/download (3).svg",
                "/studio_logos/ec385d7960656a148380.svg"
              ].map((src, i) => (
                <div key={`logo-1-${i}`} className="flex-shrink-0 mx-3 md:mx-6 lg:mx-8 flex items-center justify-center">
                  <Image 
                    src={src} 
                    alt={`Studio logo ${i + 1}`} 
                    width={120} 
                    height={60}
                    sizes="120px"
                    loading="lazy"
                    className="h-8 md:h-10 lg:h-14 w-auto object-contain brightness-0 invert hover:brightness-100 hover:invert-0 transition-all duration-300 opacity-90 hover:opacity-100" 
                  />
                </div>
              ))}
              
              {/* Duplicate set for seamless loop */}
              {[
                "/studio_logos/628aef2de771811b441e.png",
                "/studio_logos/download.svg",
                "/studio_logos/download (1).svg",
                "/studio_logos/download (2).svg",
                "/studio_logos/download (3).svg",
                "/studio_logos/ec385d7960656a148380.svg"
              ].map((src, i) => (
                <div key={`logo-2-${i}`} className="flex-shrink-0 mx-3 md:mx-6 lg:mx-8 flex items-center justify-center">
                  <Image 
                    src={src} 
                    alt={`Studio logo ${i + 1}`} 
                    width={120} 
                    height={60}
                    sizes="120px"
                    loading="lazy"
                    className="h-8 md:h-10 lg:h-14 w-auto object-contain brightness-0 invert hover:brightness-100 hover:invert-0 transition-all duration-300 opacity-90 hover:opacity-100" 
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-8 md:py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-3">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Featured Projects Hiring Now</h2>
            <Link href="/find-work"><Button variant="outline" className="border-indigo-600 text-indigo-600 hover:bg-indigo-50 whitespace-nowrap">Browse all</Button></Link>
          </div>
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {projects.map((project) => (
                <ProjectCardWrapper key={project.id} project={project as any} onApply={undefined} />
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No projects available right now.</p>
          )}
        </div>
      </section>

      {/* Top Crew */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-2xl md:text-3xl font-bold text-gray-900 px-2">Standout Crew</h2>
            <p className="text-sm md:text-base text-gray-600 px-4">Explore some of the most sought‑after professionals</p>
          </div>
          {crew.length > 0 ? <CrewSlider crew={crew as any} /> : <FallbackCrewSlider />}
        </div>
      </section>

      {/* How it works */}
      <section className="py-8 md:py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4 px-2">How It Works</h2>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-4">Getting started is simple. Build your profile and start connecting with opportunities in minutes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {[
              {
                step: '01',
                title: 'Create Your Profile',
                desc: 'Build a comprehensive profile showcasing your roles, credits, portfolio reels, day rates, and availability. Make it easy for employers to see what you bring to their production.'
              },
              {
                step: '02',
                title: 'Get Discovered',
                desc: 'Let employers find you through our smart search system. They can filter by role, skills, experience level, location, and budget to match their exact needs.'
              },
              {
                step: '03',
                title: 'Apply & Get Hired',
                desc: 'Browse open projects, submit applications, and manage all your communications in one place. Track your applications and get hired faster.'
              }
            ].map((s, i) => (
              <div key={i} className="relative">
                <Card className="shadow-lg border-gray-200 hover:shadow-xl transition-all duration-300 bg-white h-full">
                  <CardHeader>
                    <div className="text-5xl font-bold text-indigo-100 mb-2">{s.step}</div>
                    <CardTitle className="text-xl font-bold text-gray-900">{s.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 leading-relaxed">{s.desc}</p>
                  </CardContent>
                </Card>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-indigo-200 z-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-8 md:py-10 bg-gradient-to-b from-indigo-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6 md:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 px-2">Flexible Plans for Teams</h2>
            <p className="text-sm md:text-base text-gray-600 px-4">Start free, upgrade when you need to reach more talent</p>
          </div>
          {/* dynamic import to avoid server-side Razorpay usage */}
          <div className="max-w-5xl mx-auto">
            <LazySubscriptionPlans />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-8 md:py-12 bg-gradient-to-br from-indigo-800 via-purple-800 to-blue-700">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 md:mb-4 px-2">Ready to Elevate Your Career?</h3>
            <p className="text-indigo-100 text-base md:text-lg mb-6 md:mb-8 px-4">Join thousands of film professionals connecting with premium opportunities on MissingCrew.</p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
              <Link href="/accounts?tab=signup&role=crew" className="w-full sm:w-auto">
                <Button size="lg" className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold px-6 md:px-8 w-full sm:w-auto">
                  Create Crew Profile
                </Button>
              </Link>
              <Link href="/find-work" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="border-2 border-white text-indigo-700 hover:bg-white/10 font-semibold px-6 md:px-8 w-full sm:w-auto">
                  Browse Projects
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// Lazy client component wrapper for SubscriptionPlans to keep SSR clean
function LazySubscriptionPlans() {
  // This component will only render on the client
  return (
    <div suppressHydrationWarning>
      {/* This empty wrapper avoids Razorpay SSR issues; component mounts on client */}
      <ClientPlans />
    </div>
  )
}

async function ClientPlans() {
  const { SubscriptionPlans } = await import('@/components/subscription/SubscriptionPlans')
  // Render as client-only by returning the component here; it uses 'use client'
  return <SubscriptionPlans />
}
