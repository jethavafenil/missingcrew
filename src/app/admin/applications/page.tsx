import { getSession } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { applicationRepo } from '@/lib/repo'
import Link from 'next/link'
import { slugifyName } from '@/lib/utils'

type AdminApplication = {
  id: string
  status: 'PENDING' | 'SHORTLISTED' | 'HIRED' | 'REJECTED'
  appliedAt: string
  crewId: string
  project: { id: string; projectName: string }
  crew: { user: { name: string | null; email: string } }
}

export default async function AdminApplicationsPage() {
  const session = await getSession()

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/admin-signin')
  }

  const rawApplications = await applicationRepo.findManyWithProjectAndCrew()

  const applications: AdminApplication[] = rawApplications.map(app => ({
    id: app.id,
    status: app.status,
    appliedAt: app.appliedAt.toISOString(),
    crewId: app.crewId,
    project: app.project
      ? { id: app.project.id, projectName: app.project.projectName }
      : { id: '', projectName: '' },
    crew: {
      user: {
        name: app.crew?.user?.name ?? null,
        email: app.crew?.user?.email ?? '',
      }
    }
  }))

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Applications</h1>
          <p className="mt-2 text-sm text-gray-700">
            Monitor all job applications on the platform
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Total Applications</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{applications.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Pending</div>
          <div className="mt-1 text-2xl font-semibold text-orange-600">
            {applications.filter((a: AdminApplication) => a.status === 'PENDING').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Hired</div>
          <div className="mt-1 text-2xl font-semibold text-green-600">
            {applications.filter((a: AdminApplication) => a.status === 'HIRED').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Rejected</div>
          <div className="mt-1 text-2xl font-semibold text-red-600">
            {applications.filter((a: AdminApplication) => a.status === 'REJECTED').length}
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="mt-8 bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applicant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applied
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                    No applications found
                  </td>
                </tr>
              ) : (
                applications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">
                          {application.crew.user.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {application.crew.user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link 
                        href={`/projects/${application.project.id}`}
                        className="text-sm text-gray-900 hover:text-blue-600"
                      >
                        {application.project.projectName}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        application.status === 'PENDING'
                          ? 'bg-orange-100 text-orange-800'
                          : application.status === 'SHORTLISTED'
                          ? 'bg-blue-100 text-blue-800'
                          : application.status === 'HIRED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {application.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(application.appliedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Link
                        href={`/crew/${slugifyName(application.crew.user.name || '')}`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        View Profile
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
