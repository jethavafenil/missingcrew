import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/server'
import { userRepo, employerProfileRepo, projectRepo, requesterFromSession, type Requester } from '@/lib/repo';
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimiter'
import { z } from 'zod'
import { parseBody } from '@/lib/api/body'
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
      shootStartDate: project.shootStartDate.toISOString(),
      shootEndDate: project.shootEndDate.toISOString(),
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

    const body = await parseBody(request, z.object({
      projectName: z.string().trim().min(1).max(200),
      projectType: z.string().trim().min(1).max(100),
      rolesNeeded: z.array(z.string().trim().min(1)).min(1).max(50),
      shootStartDate: z.coerce.date(),
      shootEndDate: z.coerce.date(),
      location: z.string().trim().min(1).max(300),
      budgetPerRole: z.union([z.string(), z.number()]).optional(),
      description: z.string().trim().min(1).max(20000),
      questions: z.union([z.array(z.unknown()), z.record(z.string(), z.unknown())]),
      contactPreference: z.union([z.array(z.unknown()), z.record(z.string(), z.unknown())]),
    }).refine((value) => value.shootEndDate >= value.shootStartDate, { message: 'Shoot end date must be on or after start date', path: ['shootEndDate'] }));
    const {
      projectName,
      projectType,
      rolesNeeded,
      shootStartDate,
      shootEndDate,
      location,
      budgetPerRole,
      description,
      questions,
      contactPreference
    } = body;

    if (!projectName || !projectType || !rolesNeeded || !shootStartDate || !shootEndDate || !location || !description || !questions || !contactPreference) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

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
      projectName,
      projectType,
      rolesNeeded,
      shootStartDate,
      shootEndDate,
      location,
      budgetPerRole: budgetPerRole !== undefined ? Number(budgetPerRole) : undefined,
      description,
      questions: questions as Record<string, unknown> | string[],
      contactPreference: contactPreference as Record<string, unknown> | string[],
      employerId: employerProfile.id,
    }, requester);

    // Mark employer profile as completed when first project is posted
    if (!employerProfile.completed) {
      await employerProfileRepo.updateByUserId(session.user.id, { completed: true }, requester);
    }

    revalidateTag('projects', 'max');
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
