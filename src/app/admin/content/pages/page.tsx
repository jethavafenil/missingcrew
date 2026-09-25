import { getSession } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ContentPagesManagement() {
  const session = await getSession()

  // If not logged in, redirect to admin sign in page
  if (!session) {
    redirect('/auth/admin-signin')
  }

  // If not admin, redirect to dashboard
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Mock data for pages - in a real app this would come from a database
  const pages = [
    {
      id: '1',
      title: 'Home Page',
      path: '/',
      lastUpdated: '2023-10-15',
      status: 'Published'
    },
    {
      id: '2',
      title: 'About Us',
      path: '/about',
      lastUpdated: '2023-09-20',
      status: 'Published'
    },
    {
      id: '3',
      title: 'Services',
      path: '/services',
      lastUpdated: '2023-10-05',
      status: 'Draft'
    },
    {
      id: '4',
      title: 'Contact',
      path: '/contact',
      lastUpdated: '2023-08-12',
      status: 'Published'
    },
    {
      id: '5',
      title: 'FAQ',
      path: '/faq',
      lastUpdated: '2023-07-30',
      status: 'Published'
    }
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Page Management</h1>
          <p className="text-gray-600 text-sm">
            Create, edit, and manage website pages
          </p>
        </div>
        <div>
          <Link
            href="/admin/content/pages/new"
            className="px-4 py-2 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-700"
          >
            Add New Page
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Path
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pages.map((page) => (
                <tr key={page.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{page.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{page.path}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{page.lastUpdated}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${page.status === 'Published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {page.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/admin/content/pages/${page.id}/edit`}
                      className="text-indigo-600 hover:text-indigo-900 mr-2"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/admin/content/pages/${page.id}`}
                      className="text-gray-600 hover:text-gray-900 mr-2"
                    >
                      View
                    </Link>
                    <Link
                      href={`/admin/content/pages/${page.id}/delete`}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
