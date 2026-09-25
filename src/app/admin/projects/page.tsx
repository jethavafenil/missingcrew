import { getSession } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { projectRepo, assertAdmin, requesterFromSession } from '@/lib/repo'
import Link from 'next/link'
import { slugifyName } from '@/lib/utils'

export default async function AdminProjectsPage() {
  const session = await getSession()

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/admin-signin')
  }

  type AdminProject = {
  id: string
  projectName: string
  projectType: string
  status: 'OPEN' | 'CLOSED' | string
  createdAt: Date
  employer?: { companyName: string | null; user?: { email?: string } }
  _count: { applications: number }
}

const projects: AdminProject[] = await projectRepo.findManyAdminWithCounts(
    assertAdmin(requesterFromSession(session))
  )

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage all projects posted on the platform
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Total Projects</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{projects.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Open</div>
          <div className="mt-1 text-2xl font-semibold text-green-600">
            {projects.filter((p: AdminProject) => p.status === 'OPEN').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Closed</div>
          <div className="mt-1 text-2xl font-semibold text-gray-600">
            {projects.filter((p: AdminProject) => p.status === 'CLOSED').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Total Applications</div>
          <div className="mt-1 text-2xl font-semibold text-blue-600">
            {projects.reduce((acc: number, p: AdminProject) => acc + p._count.applications, 0)}
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="mt-8 bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applications
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Posted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                    No projects found
                  </td>
                </tr>
              ) : (
                projects.map((project: AdminProject) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <Link 
                          href={`/projects/${project.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600"
                        >
                          {project.projectName}
                        </Link>
                        <div className="text-xs text-gray-500 mt-1">
                          {project.projectType}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="text-sm text-gray-900">
                          {project.employer?.companyName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {project.employer?.user?.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        project.status === 'OPEN'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {project._count.applications}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
