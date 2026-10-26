import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { applicationRepo, crewProfileRepo, notificationRepo, projectRepo, requesterFromSession } from '@/lib/repo'
import { sendEmail, createApplicationEmail, createApplicationsMilestoneEmail } from '@/lib/email'
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimiter'
import { z } from 'zod'
import { parseBody } from '@/lib/api/body'
import { monthlyApplicationLimit } from '@/lib/subscription/access'
import { arePaidPlansEnabled } from '@/lib/settings'

// Ids are TEXT (legacy cuids + new uuids); this charset also rules out
// PostgREST filter metacharacters (, . ( ) etc).
const SAFE_ID_RE = /^[A-Za-z0-9_-]{1,64}$/

// Producers get a nudge email once their project reaches this many applications.
const APPLICATION_MILESTONE = 5

interface RouteContext {
  params: Promise<{ id: string }>
}

async function resolveProjectId(param: string): Promise<string> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param)
  if (isUuid) return param

  const direct = await projectRepo.findById(param)
  if (direct) return direct.id

  const name = decodeURIComponent(param).replace(/-/g, ' ').trim()
  if (!name) return param

  const matched = (await projectRepo.findFirstByProjectNameExact(name)) ??
    (await projectRepo.findFirstByProjectNameContainsAll(name.split(/\s+/).filter(Boolean)))
  return matched ? matched.id : param
}


export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const limited = await rateLimitMiddleware(request, 'application-apply', { userId: session.user.id, policy: RATE_LIMITS.applicationApply })
    if (limited) return limited

    const requester = requesterFromSession(session)

    // Rest of your code stays the same...
    const crewProfile = await crewProfileRepo.findByUserIdWithUser(session.user.id)

    if (!crewProfile) {
      return NextResponse.json(
        { error: 'Complete your profile before applying' },
        { status: 400 }
      )
    }

    // Trial / PRO crew apply without limit; everyone else gets the monthly cap.
    const maxApplications = monthlyApplicationLimit(crewProfile, new Date(), await arePaidPlansEnabled())

    // Check if user has reached their application limit
    const applicationCount = await applicationRepo.countByCrewIdSince(
      crewProfile.id,
      new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    )

    if (applicationCount >= maxApplications) {
      return NextResponse.json(
        { error: `You've reached your monthly application limit. Upgrade to apply to more gigs.` },
        { status: 400 }
      )
    }

    const { answers, notes } = await parseBody(request, z.object({
      answers: z.union([z.array(z.unknown()), z.record(z.string(), z.unknown())]).default([]),
      notes: z.string().max(5000).optional(),
    }))
    const { id } = await context.params
    const projectId = await resolveProjectId(id)

    // The project must exist and still be accepting applications.
    const targetProject = SAFE_ID_RE.test(projectId) ? await projectRepo.findByIdRaw(projectId) : null
    if (!targetProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    if (targetProject.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'This project is no longer accepting applications' },
        { status: 400 }
      )
    }

    const existingApplication = await applicationRepo.findUniqueByProjectAndCrew(projectId, crewProfile.id)

    if (existingApplication) {
      return NextResponse.json(
        { error: 'Already applied to this project' },
        { status: 400 }
      )
    }

    let created
    try {
      created = await applicationRepo.create({
        projectId,
        crewId: crewProfile.id,
        crewNotes: notes,
        answers: answers as Record<string, unknown> | string[]
      }, requester)
    } catch (err) {
      // Two concurrent requests can both pass the check above; the unique
      // index (project_id, crew_id) is the real guard.
      if (err instanceof Error && /duplicate key|23505/i.test(err.message)) {
        return NextResponse.json(
          { error: 'Already applied to this project' },
          { status: 400 }
        )
      }
      throw err
    }

    // Re-read with the project/employer and crew/user relations the
    // notification + email steps below need (Prisma did this in one create).
    const application = (await applicationRepo.findById(created.id))!

    // Create notification for the employer
    const notification = await notificationRepo.create({
      userId: application.project!.employer!.userId,
      type: 'APPLICATION_RECEIVED',
      title: 'New Application Received',
      message: `${application.crew!.user!.name} has applied to your project: ${application.project!.projectName}`,
      data: {
        applicationId: application.id,
        projectId: application.projectId,
        crewId: application.crewId,
        crewName: application.crew!.user!.name,
        crewEmail: application.crew!.user!.email,
        projectName: application.project!.projectName,
        projectType: application.project!.projectType,
        appliedAt: application.appliedAt
      }
    }, requester)

    // Send email notification to employer
    try {
      const { subject, html } = createApplicationEmail(
        application.project!.employer!.user!.email,
        application.crew!.user!.name || application.crew!.user!.email,
        application.project!.projectName,
        application.crew!.user!.email
      );

      await sendEmail({
        to: application.project!.employer!.user!.email,
        subject,
        html
      });
    } catch (error) {
      console.error('Error sending email notification:', error)
    }

    // Milestone (#23, email 2): exactly once, when the project reaches 5 applications.
    try {
      const totalApplications = await applicationRepo.countByProjectId(projectId)
      if (totalApplications === APPLICATION_MILESTONE) {
        const employerUser = application.project!.employer!.user!
        const employerName = employerUser.name || 'there'
        await notificationRepo.create({
          userId: application.project!.employer!.userId,
          type: 'APPLICATION_RECEIVED',
          title: `${APPLICATION_MILESTONE} applications received`,
          message: `${application.project!.projectName} now has ${APPLICATION_MILESTONE} applications. Review and shortlist your favourites.`,
          data: { projectId, milestone: APPLICATION_MILESTONE },
        }, requester)
        const { subject, html } = createApplicationsMilestoneEmail(employerName, application.project!.projectName, APPLICATION_MILESTONE)
        await sendEmail({ to: employerUser.email, subject, html })
      }
    } catch (error) {
      console.error('Application milestone notification failed:', error)
    }

    // Return only the crew member's own application fields; the re-read above
    // embeds the employer's and project's contact details, which must not be
    // sent back to the applicant.
    return NextResponse.json({
      success: true,
      data: {
        id: application.id,
        projectId: application.projectId,
        crewId: application.crewId,
        status: application.status,
        appliedAt: application.appliedAt,
      },
    })
} catch (error) {
    console.error('Error applying to project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ hasApplied: false }, { status: 200 })
    }

    const { id } = await context.params
    const projectId = await resolveProjectId(id)

    // Find the crew profile
    const crewProfile = await crewProfileRepo.findByUserId(session.user.id, requesterFromSession(session))

    if (!crewProfile) {
      return NextResponse.json({ hasApplied: false }, { status: 200 })
    }

    // Check if the crew has already applied to this project
    const existingApplication = await applicationRepo.findUniqueByProjectAndCrew(projectId, crewProfile.id)

    return NextResponse.json({ hasApplied: !!existingApplication }, { status: 200 })
  } catch (error) {
    console.error('Error checking application status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
