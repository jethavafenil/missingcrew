import { getSession } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import {
  userRepo,
  projectRepo,
  applicationRepo,
  subscriptionRepo,
  crewProfileRepo,
  SYSTEM_REQUESTER,
} from '@/lib/repo'
import Link from 'next/link'

export default async function AdminDashboard() {
  const session = await getSession()

  // If not logged in, redirect to admin sign in page
  if (!session) {
    redirect('/auth/admin-signin')
  }

  // If not admin, redirect to dashboard
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Get comprehensive statistics
  const [totalUsers, crewCount, employerCount, adminCount] = await Promise.all([
    userRepo.countAll(SYSTEM_REQUESTER),
    userRepo.countByRole('CREW', SYSTEM_REQUESTER),
    userRepo.countByRole('EMPLOYER', SYSTEM_REQUESTER),
    userRepo.countByRole('ADMIN', SYSTEM_REQUESTER)
  ])

  const [totalProjects, openProjects, closedProjects, completedProfiles] = await Promise.all([
    projectRepo.countAll(SYSTEM_REQUESTER),
    projectRepo.countByStatus('OPEN', SYSTEM_REQUESTER),
    projectRepo.countByStatus('CLOSED', SYSTEM_REQUESTER),
    crewProfileRepo.countCompleted(SYSTEM_REQUESTER)
  ])

  const [totalApplications, pendingApplications, activeSubscriptions] = await Promise.all([
    applicationRepo.countAll(SYSTEM_REQUESTER),
    applicationRepo.countByStatus('PENDING', SYSTEM_REQUESTER),
    subscriptionRepo.countByStatus('ACTIVE', SYSTEM_REQUESTER)
  ])

  // Get recent users (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const recentUsers = await userRepo.countCreatedSince(sevenDaysAgo, SYSTEM_REQUESTER)

  // Get recent projects (last 7 days)
  const recentProjects = await projectRepo.countCreatedSince(sevenDaysAgo, SYSTEM_REQUESTER)

  const completionPercentage = crewCount > 0 ? Math.round((completedProfiles * 100) / crewCount) : 0

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalUsers}</p>
                <p className="text-xs text-green-600 mt-1">+{recentUsers} this week</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <div className="text-3xl">👥</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalProjects}</p>
                <p className="text-xs text-green-600 mt-1">+{recentProjects} this week</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <div className="text-3xl">💼</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Applications</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalApplications}</p>
                <p className="text-xs text-orange-600 mt-1">{pendingApplications} pending</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <div className="text-3xl">📄</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{activeSubscriptions}</p>
                <p className="text-xs text-gray-500 mt-1">Revenue tracking</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <div className="text-3xl">💳</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Crew Members</h3>
              <span className="text-2xl font-bold text-green-600">{crewCount}</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Completed Profiles</span>
                <span className="font-medium">{completedProfiles}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
            </div>
            <Link href="/admin/users?role=CREW" className="mt-4 inline-block text-sm text-green-600 hover:underline">
              View all crew →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Employers</h3>
              <span className="text-2xl font-bold text-purple-600">{employerCount}</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Projects Posted</span>
                <span className="font-medium">{totalProjects}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Open Projects</span>
                <span className="font-medium">{openProjects}</span>
              </div>
            </div>
            <Link href="/admin/users?role=EMPLOYER" className="mt-4 inline-block text-sm text-purple-600 hover:underline">
              View all employers →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Projects Status</h3>
              <span className="text-2xl font-bold text-blue-600">{totalProjects}</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Open</span>
                <span className="font-medium text-green-600">{openProjects}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Closed</span>
                <span className="font-medium text-gray-600">{closedProjects}</span>
              </div>
            </div>
            <Link href="/admin/projects" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
              Manage projects →
            </Link>
          </div>
        </div>

        {/* Main Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Management Section */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
              <Link href="/admin/users" className="text-sm text-blue-600 hover:underline">
                View all →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/admin/users?role=CREW"
                className="group p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg hover:shadow-md transition-all border border-blue-200"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-blue-900 group-hover:text-blue-700">Crew Members</h3>
                    <p className="text-sm text-blue-700 mt-1">Manage crew profiles and verify accounts</p>
                  </div>
                  <span className="text-blue-600 text-xl">→</span>
                </div>
              </Link>

              <Link
                href="/admin/users?role=EMPLOYER"
                className="group p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg hover:shadow-md transition-all border border-purple-200"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-purple-900 group-hover:text-purple-700">Employers</h3>
                    <p className="text-sm text-purple-700 mt-1">Manage employer accounts and companies</p>
                  </div>
                  <span className="text-purple-600 text-xl">→</span>
                </div>
              </Link>

              <Link
                href="/admin/projects"
                className="group p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-lg hover:shadow-md transition-all border border-green-200"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-green-900 group-hover:text-green-700">Projects</h3>
                    <p className="text-sm text-green-700 mt-1">Monitor and manage all posted projects</p>
                  </div>
                  <span className="text-green-600 text-xl">→</span>
                </div>
              </Link>

              <Link
                href="/admin/applications"
                className="group p-5 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg hover:shadow-md transition-all border border-orange-200"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-orange-900 group-hover:text-orange-700">Applications</h3>
                    <p className="text-sm text-orange-700 mt-1">Review and manage job applications</p>
                  </div>
                  <span className="text-orange-600 text-xl">→</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Quick Actions & Settings */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Link
                  href="/admin/content/pages"
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span className="text-sm font-medium">Manage Pages</span>
                  </div>
                  <span className="text-gray-400 group-hover:text-gray-600 text-xl">→</span>
                </Link>

                <Link
                  href="/admin/blog"
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                    <span className="text-sm font-medium">Blog Posts</span>
                  </div>
                  <span className="text-gray-400 group-hover:text-gray-600 text-xl">→</span>
                </Link>

                <Link
                  href="/admin/content/media"
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium">Media Library</span>
                  </div>
                  <span className="text-gray-400 group-hover:text-gray-600 text-xl">→</span>
                </Link>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">System Settings</h2>
              <div className="space-y-2">
                <Link
                  href="/admin/settings/general"
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm font-medium">General Settings</span>
                  </div>
                  <span className="text-gray-400 group-hover:text-gray-600 text-xl">→</span>
                </Link>

                <Link
                  href="/admin/settings/subscriptions"
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span className="text-sm font-medium">Subscription Plans</span>
                  </div>
                  <span className="text-gray-400 group-hover:text-gray-600 text-xl">→</span>
                </Link>

                <Link
                  href="/admin/settings/payments"
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2s3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2-.89-2-2V7c0-1.11.89-2 2-2" />
                    </svg>
                    <span className="text-sm font-medium">Payment Settings</span>
                  </div>
                  <span className="text-gray-400 group-hover:text-gray-600 text-xl">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}
