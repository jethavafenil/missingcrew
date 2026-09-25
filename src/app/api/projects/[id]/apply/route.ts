import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { applicationRepo, crewProfileRepo, notificationRepo, requesterFromSession } from '@/lib/repo'
import { sendEmail, createApplicationEmail } from '@/lib/email'
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimiter'
import { z } from 'zod'
import { parseBody } from '@/lib/api/body'

interface RouteContext {
  params: Promise<{ id: string }>
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

    // Check application limits based on subscription tier
    let maxApplications = 10 // Default for FREE_TRIAL
    if (crewProfile.subscriptionTier === 'BASIC') {
      maxApplications = 10
    } else if (crewProfile.subscriptionTier === 'PRO') {
      maxApplications = Infinity // Unlimited for Pro
    }

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
    const projectId = id

    const existingApplication = await applicationRepo.findUniqueByProjectAndCrew(projectId, crewProfile.id)

    if (existingApplication) {
      return NextResponse.json(
        { error: 'Already applied to this project' },
        { status: 400 }
      )
    }

    const created = await applicationRepo.create({
      projectId,
      crewId: crewProfile.id,
      crewNotes: notes,
      answers: answers as Record<string, unknown> | string[]
    }, requester)

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

    return NextResponse.json({ success: true, data: application })
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
    const projectId = id

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
