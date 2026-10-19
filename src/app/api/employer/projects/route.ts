import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/server'
import { userRepo, employerProfileRepo, projectRepo, notificationRepo, requesterFromSession, type Requester } from '@/lib/repo';
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimiter'
import { parseBody } from '@/lib/api/body'
import { isBeforeToday } from '@/lib/utils'
import { projectInputSchema } from '@/lib/projects/schema'
import { ApiError } from '@/lib/api/errors'
import { sendEmail, createProjectLiveEmail } from '@/lib/email'
import { revalidateTag } from 'next/cache'

async function getOrCreateEmployerProfile(userId: string, requester: Requester) {
  // Fetch user to confirm role
  const user = await userRepo.findById(userId, requester);
  if (!user) return null;

  // Only employers have employerProfile
  if (user.role !== 'EMPLOYER') return null;

  // Try to find existing profile
  let employerProfile = await employerProfileRepo.findByUserId(userId, requester);
  if (employerProfile) return employerProfile;

  // Create a minimal employer profile to unblock first post
  employerProfile = await employerProfileRepo.create({
    userId,
    companyName: user.name || user.email || 'My Company',
    completed: false,
  }, requester);
  return employerProfile;
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const limited = await rateLimitMiddleware(request as import('next/server').NextRequest, 'project-post', { userId: session.user.id, policy: RATE_LIMITS.projectPost })
    if (limited) return limited


    const requester = requesterFromSession(session);

    // Fetch or create the EmployerProfile associated with the User
    const employerProfile = await getOrCreateEmployerProfile(session.user.id, requester);

    if (!employerProfile) {
      return NextResponse.json(
        { error: 'Employer profile not found or user is not an employer' },
        { status: 403 }
      );
    }


    // Fetch all projects for this employer
    const projects = await projectRepo.findManyByEmployerId(employerProfile.id, requester);


    // Format the projects to include all necessary data
    const formattedProjects = projects.map((project: any) => ({
      ...project,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      shootStartDate: project.shootStartDate ? project.shootStartDate.toISOString() : null,
      shootEndDate: project.shootEndDate ? project.shootEndDate.toISOString() : null,
      applications: project.applications.map((application: any) => ({
        ...application,
        appliedAt: application.appliedAt.toISOString(),
        answers: application.answers || [],
        crew: {
          ...application.crew,
          user: {
            ...application.crew.user,
            // Remove sensitive data
            password: undefined
          }
        }
      }))
    }));

    return NextResponse.json({ projects: formattedProjects });
  } catch (error) {
    console.error('[GET /api/employer/projects] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await parseBody(request, projectInputSchema);
    // New projects can't start in the past (dates are optional).
    if (body.shootStartDate && isBeforeToday(body.shootStartDate)) {
      return NextResponse.json({ error: 'Shoot start date cannot be in the past' }, { status: 400 });
    }
    const { projectName, description } = body;

    // Fetch or create the EmployerProfile associated with the User
    const requester = requesterFromSession(session);
    const employerProfile = await getOrCreateEmployerProfile(session.user.id, requester);

    if (!employerProfile) {
      return NextResponse.json(
        { error: 'Employer profile not found or user is not an employer' },
        { status: 403 }
      );
    }

    const project = await projectRepo.create({
      projectName: body.projectName,
      projectType: body.projectType,
      rolesNeeded: body.rolesNeeded,
      shootStartDate: body.shootStartDate,
      shootEndDate: body.shootEndDate,
      location: body.location,
      budgetMin: body.budgetMin,
      budgetMax: body.budgetMax,
      budgetFixed: body.budgetFixed,
      productionHouse: body.productionHouse,
      description,
      questions: body.questions,
      contactPreference: body.contactPreference,
      employerId: employerProfile.id,
    }, requester);

    // Mark employer profile as completed when first project is posted
    if (!employerProfile.completed) {
      await employerProfileRepo.updateByUserId(session.user.id, { completed: true }, requester);
    }

    // Milestone (#23, email 1): confirm the project is live and explain next steps.
    try {
      const employerName = employerProfile.companyName || session.user.name || 'there';
      await notificationRepo.create({
        userId: session.user.id,
        type: 'PROJECT_POSTED',
        title: 'Your project is live',
        message: `${projectName} is now visible to crew members.`,
        data: { projectId: project.id },
      }, requester);
      if (session.user.email) {
        const { subject, html } = createProjectLiveEmail(employerName, projectName);
        await sendEmail({ to: session.user.email, subject, html });
      }
    } catch (mailError) {
      console.error('Project-live notification failed:', mailError);
    }

    revalidateTag('projects', 'max');
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    // Validation failures (400) carry a user-facing message; surface them.
    if (error instanceof ApiError && error.status < 500) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
