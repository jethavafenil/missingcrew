import { NextResponse } from 'next/server'
import { getPublicProject } from '@/lib/cache/public'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawParam } = await params

    const project = await getPublicProject(rawParam)

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Public route (CDN-cached): never expose the employer's email address.
    const publicProject = {
      ...project,
      employer: project.employer && {
        ...project.employer,
        user: project.employer.user && { ...project.employer.user, email: undefined },
      },
    }

    return NextResponse.json({ project: publicProject }, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
