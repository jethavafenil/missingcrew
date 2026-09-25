import { env } from '@/lib/env'
import type { Metadata } from 'next'
import { getPublicProject, getPublicProjects } from '@/lib/cache/public'

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
    const project = await getPublicProject(id)
    const name: string | undefined = project?.projectName

    if (!project || !name) return {}

    const slug = slugify(name)
    const url = `${baseUrl}/projects/${slug}`
    const title = `${name} • MissingCrew`
    const description = project?.description?.slice?.(0, 150) || 'Find film crew projects on MissingCrew.'

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        type: 'website',
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
    const projects = await getPublicProjects()
    return projects.slice(0, 100).map((project) => ({ id: slugify(project.projectName) }))
  } catch {
    return []
  }
}

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  return children as React.ReactElement
}
