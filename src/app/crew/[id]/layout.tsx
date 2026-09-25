import { env } from '@/lib/env'
import type { Metadata } from 'next'
import { getPublicCrew, getPublicCrewProfile } from '@/lib/cache/public'

const baseUrl = env.NEXT_PUBLIC_SITE_URL || 'https://missingcrew.vercel.app'

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    const { id } = await params
    const crew = await getPublicCrewProfile(id)
    const name: string | undefined = crew?.user?.name ?? undefined

    if (!crew || !name) return {}

    const slug = slugify(name)
    const url = `${baseUrl}/crew/${slug}`
    const title = `${name} • MissingCrew`
    const description = crew?.primaryRoles?.length ? `${name} — ${crew.primaryRoles.join(', ')}` : `${name} — Crew Profile`

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        type: 'profile',
        url,
        title,
        description,
      },
      robots: { index: true, follow: true },
    }
  } catch {
    return {}
  }
}

export async function generateStaticParams() {
  try {
    const crew = await getPublicCrew()
    return crew.slice(0, 100).flatMap((profile) => profile.user?.name ? [{ id: slugify(profile.user.name) }] : [])
  } catch {
    return []
  }
}

export default function CrewLayout({ children }: { children: React.ReactNode }) {
  return children as React.ReactElement
}
