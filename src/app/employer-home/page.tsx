import { env } from '@/lib/env'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import AnonymousRoleToggle from '@/components/AnonymousRoleToggle'
import RoleRedirect from '@/components/auth/RoleRedirect'
import { crewProfileRepo } from '@/lib/repo'

interface CrewMember {
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
  pastProjects: Array<{
    title?: string
    year?: number
    role?: string
    link?: string | null
    notes?: string | null
  }>
  contactWhatsApp: string | null
  subscriptionTier: string
  createdAt: string
}

// No page-level revalidate: the root layout resolves the session per request,
// so this route renders dynamically.

async function getFeaturedCrew(): Promise<CrewMember[]> {
  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return []
    const dbCrew = await crewProfileRepo.findManyWithUser({
      userRole: 'CREW',
      orderBy: 'createdAt',
      take: 9,
    })

    type RawProfile = any
    return dbCrew.map((profile: RawProfile) => {
      const toStringArray = (value: unknown): string[] => {
        if (Array.isArray(value)) return value as string[]
        if (typeof value === 'string') { try { return JSON.parse(value) } catch { return [] } }
        return []
      }
      const rawPortfolio = (profile as any).portfolioLinks
      const portfolioLinks: string[] = Array.isArray(rawPortfolio)
        ? (rawPortfolio as string[])
        : (typeof rawPortfolio === 'string' ? (()=>{ try { return JSON.parse(rawPortfolio as string) } catch { return [rawPortfolio as string] } })() : [])
      let pastProjects: Array<{ title?: string; year?: number; role?: string; link?: string | null; notes?: string | null }> = []
      const rawPast = (profile as any).pastProjects
      if (Array.isArray(rawPast)) pastProjects = (rawPast as unknown[]).filter((p: unknown) => p !== null) as Array<{ title?: string; year?: number; role?: string; link?: string | null; notes?: string | null }>
      else if (typeof rawPast === 'string') { try { const p = JSON.parse(rawPast as string); pastProjects = Array.isArray(p) ? p : [p] } catch {} }
      const availStart = (profile as any).availabilityStart
      const availEnd = (profile as any).availabilityEnd
      return {
        id: String((profile as any).id ?? ''),
        user: {
          name: String((profile as any).user?.name ?? ''),
          email: String((profile as any).user?.email ?? ''),
          phone: String((profile as any).user?.phone ?? ''),
          phoneVerified: Boolean((profile as any).user?.phoneVerified ?? false),
        },
        photo: (profile as any).photo ?? null,
        city: String((profile as any).city ?? ''),
        primaryRoles: toStringArray((profile as any).primaryRoles) || [],
        yearsExperience: String((profile as any).yearsExperience ?? ''),
        location: String((profile as any).location ?? ''),
        availableToTravel: Boolean((profile as any).availableToTravel ?? false),
        availability: Boolean((profile as any).availability ?? false),
        availabilityStart: availStart ? new Date(availStart as any).toISOString() : null,
        availabilityEnd: availEnd ? new Date(availEnd as any).toISOString() : null,
        projectTypes: toStringArray((profile as any).projectTypes) || [],
        dailyBudgetMin: (profile as any).dailyBudgetMin ?? null,
        dailyBudgetMax: (profile as any).dailyBudgetMax ?? null,
        languages: toStringArray((profile as any).languages) || [],
        imdbLink: String((profile as any).imdbLink ?? ''),
        portfolioLinks: portfolioLinks || [],
        pastProjects: pastProjects || [],
        contactWhatsApp: String((profile as any).contactWhatsApp ?? ''),
        subscriptionTier: String((profile as any).subscriptionTier ?? ''),
        createdAt: (profile as any).createdAt ? new Date((profile as any).createdAt as any).toISOString() : new Date().toISOString(),
      } as CrewMember
    })
  } catch (error) {
    console.warn('[EmployerHome] Skipping dynamic crew due to DB error', error)
    return []
  }
}

export default async function EmployerHome() {
  const [crewModule, { CrewSlider }, { FallbackCrewSlider }] = await Promise.all([
    getFeaturedCrew(),
    import('@/components/crew/CrewSlider'),
    import('@/components/crew/FallbackCrewSlider'),
  ])
  const crew = crewModule as unknown as CrewMember[]

  return (
    <RoleRedirect allowedRole="EMPLOYER" redirectTo="/crew-home">
    <div className="min-h-screen bg-gradient-to-b from-white via-indigo-50/40 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-800 via-purple-800 to-blue-700 text-white">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full bg-indigo-500/20 blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute top-1/3 -right-16 w-80 h-80 rounded-full bg-purple-500/20 blur-3xl animate-blob animation-delay-4000" />
          <div className="absolute -bottom-10 left-1/3 w-56 h-56 rounded-full bg-blue-500/20 blur-2xl animate-blob animation-delay-6000" />
        </div>
        <div className="relative container mx-auto px-4 py-4 md:py-6">
          <div className="max-w-5xl mx-auto text-center">
            <div className="flex w-full justify-center items-center mb-4 md:mb-3">
              {/* Role toggle present on both pages, defaults to employer here */}
              {/* Show role toggle only for anonymous users */}
              <AnonymousRoleToggle initialActive="employer" />
            </div>
            <div className="inline-flex items-center px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-4 text-xs md:text-sm">
              <span className="mr-2">🎯</span> Hire Verified Film & TV Crew
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-3 md:mb-4 px-2">
              Build Your Dream Crew <span className="block sm:inline text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-200">Fast and Confidently</span>
            </h1>
            <p className="text-sm md:text-base text-indigo-100 max-w-2xl mb-4 mx-auto px-4">
              Post a requirement in minutes, get matched with top professionals, and manage applications seamlessly.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3 justify-center px-4">
              <Link href="/accounts?tab=signup&role=employer&intent=post-requirement" className="w-full sm:w-auto">
                <Button size="default" className="bg-white text-indigo-700 hover:bg-indigo-100 px-5 md:px-6 border border-white/30 w-full sm:w-auto">Post a Requirement</Button>
              </Link>
              <Link href="/browse-crew" className="w-full sm:w-auto">
                <Button size="default" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white px-5 md:px-6 w-full sm:w-auto">Browse Crew</Button>
              </Link>
            </div>
            <div className="mt-4 md:mt-5 flex flex-wrap items-center justify-center gap-3 md:gap-6 text-indigo-100/90 text-xs md:text-sm px-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 md:h-6 md:w-6 items-center justify-center rounded-full bg-green-500/20 text-green-300 text-xs">✓</span>
                <span>Verified Profiles</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 md:h-6 md:w-6 items-center justify-center rounded-full bg-green-500/20 text-green-300 text-xs">✓</span>
                <span>Smart Matching</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 md:h-6 md:w-6 items-center justify-center rounded-full bg-green-500/20 text-green-300 text-xs">✓</span>
                <span>Application Tracking</span>
              </div>
            </div>

           {/* Stats section - now with glassmorphism effect and responsive layout */}
           <div className="mt-8 md:mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 lg:gap-8 max-w-4xl mx-auto animate-fade-in-up animation-delay-1500 px-2">
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

      {/* How It Works */}
      <section className="py-8 md:py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 md:mb-12 lg:mb-16">
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-indigo-600"></div>
              <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">Simple Process</span>
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-indigo-600"></div>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent mb-2 md:mb-3 px-2">How Hiring Works</h2>
            <p className="text-base md:text-lg text-gray-600 px-4">A streamlined process designed for busy producers and hiring managers</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 md:gap-6 lg:gap-8">
            {[{
              title: 'Post Your Requirement',
              desc: 'Describe roles, dates, and budget. Our templates make it quick.',
              icon: '📝'
            },{
              title: 'Get Matched & Shortlist',
              desc: 'We surface top profiles. Use filters to refine and shortlist.',
              icon: '✨'
            },{
              title: 'Hire with Confidence',
              desc: 'Chat, review portfolios, and track applications all in one place.',
              icon: '✅'
            }].map((step, idx) => (
              <div key={idx} className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-4">{step.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
              </div>
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

      {/* Value Props */}
      <section className="py-8 md:py-12 bg-gradient-to-b from-indigo-50 to-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 md:gap-6 lg:gap-8">
            {[{
              title: 'Verified Professionals',
              desc: 'Profiles with verified contact info, past projects, and portfolios.',
              icon: (
                <svg className="h-6 w-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
              )
            },{
              title: 'Powerful Filters',
              desc: 'Find the right fit by role, experience, location, budget, and availability.',
              icon: (
                <svg className="h-6 w-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4h18M6 8h12M9 12h6M10 16h4"/></svg>
              )
            },{
              title: 'Application Tracking',
              desc: 'Manage applicants, ask custom questions, and move faster.',
              icon: (
                <svg className="h-6 w-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
              )
            }].map((f, i) => (
              <div key={i} className="rounded-xl border bg-white p-6 shadow-sm">
                <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Crew */}
      <section className="py-8 md:py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 md:gap-4 mb-8 md:mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1 w-1 rounded-full bg-purple-600"></div>
                <span className="text-sm font-semibold text-purple-600 uppercase tracking-wider">Top Talent</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent px-2 md:px-0">Featured Crew</h2>
              <p className="text-sm md:text-base text-gray-600 mt-2 px-2 md:px-0">Explore top talent available for your production</p>
            </div>
            <Link href="/browse-crew" className="text-indigo-600 hover:text-indigo-800 font-medium text-sm md:text-base px-2 md:px-0">Browse all crew →</Link>
          </div>
          {crew.length > 0 ? (
            <CrewSlider crew={crew} />
          ) : (
            <FallbackCrewSlider />
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-8 md:py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 md:mb-12 lg:mb-16">
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-indigo-600"></div>
              <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">Questions</span>
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-indigo-600"></div>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent mb-2 md:mb-3 px-2">Employer FAQ</h2>
            <p className="text-base md:text-lg text-gray-600 px-4">Everything you need to know to hire with MissingCrew</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 lg:gap-8 max-w-5xl mx-auto">
            {[{
              q: 'How quickly will I receive applications?',
              a: 'Most roles begin receiving applicants within hours. Promoted posts and broader searches increase visibility.'
            },{
              q: 'Can I invite crew directly?',
              a: 'Yes. You can browse and invite any crew member to apply to your requirement.'
            },{
              q: 'Do you verify profiles?',
              a: 'We verify phone numbers and encourage portfolio links and credits. You can also request references.'
            },{
              q: 'How do payments work?',
              a: 'MissingCrew helps you discover and connect. Payments and contracts are handled directly between you and the crew.'
            }].map((item, idx) => (
              <div key={idx} className="rounded-xl border p-5 md:p-6 bg-white">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">{item.q}</h3>
                <p className="text-sm md:text-base text-gray-600">{item.a}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10 md:mt-12 px-4">
            <Link href="/accounts?tab=signup&role=employer&intent=post-requirement" className="inline-block w-full sm:w-auto">
              <Button size="lg" className="px-6 md:px-8 w-full sm:w-auto">Post Your First Requirement</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
    </RoleRedirect>
  )
}
