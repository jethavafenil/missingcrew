import { getSession } from '@/lib/auth/server'
import { redirect } from 'next/navigation';
import { userRepo, employerProfileRepo, requesterFromSession } from '@/lib/repo';
import { EmployerDashboard } from '@/components/dashboard/EmployerDashboard';

export default async function EmployerDashboardPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect('/accounts?tab=signin&role=employer');
  }

  const requester = requesterFromSession(session);

  // First check if the user exists and has an employer profile
  const user = await userRepo.findById(session.user.id, requester);

  if (!user?.employerProfile) {
    redirect('/employer/profile-setup');
  }

  // Now fetch the projects separately to ensure we get fresh data
  const userWithProjects = await employerProfileRepo.findByUserIdWithProjectsAndApplications(
    session.user.id
  );

  // Ensure the user object matches the expected structure
  const userData = {
    email: user.email,
    name: user.name || undefined,
    role: user.role || undefined,
    employerProfile: {
      ...userWithProjects,
      createdAt: userWithProjects?.createdAt?.toISOString(),
      updatedAt: userWithProjects?.updatedAt?.toISOString(),
      projects: userWithProjects?.projects?.map((project: any) => ({
        id: project.id,
        projectName: project.projectName,
        projectType: project.projectType,
        rolesNeeded: Array.isArray(project.rolesNeeded) ? (project.rolesNeeded as string[]) : [],
        shootStartDate: project.shootStartDate.toISOString(),
        shootEndDate: project.shootEndDate.toISOString(),
        location: project.location,
        description: project.description,
        questions: Array.isArray(project.questions) ? (project.questions as string[]) : [],
        status: project.status,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        applications: project.applications.map((application: any) => ({
          id: application.id,
          crew: {
            id: application.crew.id,
            user: {
              name: application.crew.user.name || 'Unknown',
            },
            primaryRoles: Array.isArray(application.crew.primaryRoles) ? (application.crew.primaryRoles as string[]) : undefined,
            yearsExperience: application.crew.yearsExperience || undefined,
            city: application.crew.city || undefined,
          },
          appliedAt: application.appliedAt.toISOString(),
          answers: Array.isArray(application.answers) ? (application.answers as string[]) : [],
        })),
      })),
    },
  };

  return <EmployerDashboard user={userData} userData={userData} />;
}
