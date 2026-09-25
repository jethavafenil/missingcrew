import { NextResponse } from 'next/server';
import { getPublicProjects } from '@/lib/cache/public';
import { toIsoString } from '@/lib/utils';

export async function GET() {
  try {
    const projects = await getPublicProjects();

    // Format the projects data to ensure consistent structure
    const formattedProjects = projects.map((project: any) => {
      // Handle rolesNeeded which might be stored in different formats
      let rolesNeeded = [];
      if (Array.isArray(project.rolesNeeded)) {
        rolesNeeded = project.rolesNeeded;
      } else if (typeof project.rolesNeeded === 'string') {
        try {
          rolesNeeded = JSON.parse(project.rolesNeeded);
        } catch (e) {
          // If parsing fails, use an empty array
          rolesNeeded = [];
        }
      }

      // Handle questions which might be stored in different formats
      let questions = [];
      if (Array.isArray(project.questions)) {
        questions = project.questions;
      } else if (typeof project.questions === 'string') {
        try {
          questions = JSON.parse(project.questions);
        } catch (e) {
          // If parsing fails, use an empty array
          questions = [];
        }
      }

      return {
        id: project.id,
        projectName: project.projectName || '',
        projectType: project.projectType || '',
        rolesNeeded: rolesNeeded || [],
        shootStartDate: toIsoString(project.shootStartDate),
        shootEndDate: toIsoString(project.shootEndDate),
        location: project.location || '',
        description: project.description || '',
        questions: questions || [],
        employer: {
          user: {
            name: project.employer?.user?.name || '',
            image: (project as any).employer?.user?.image || null,
          }
        },
        _count: {
          applications: project._count?.applications || 0
        }
      };
    });

    return NextResponse.json({ projects: formattedProjects }, { status: 200, headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
