import { getSession } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function BlogManagement() {
  const session = await getSession()

  // If not logged in, redirect to admin sign in page
  if (!session) {
    redirect('/auth/admin-signin')
  }

  // If not admin, redirect to dashboard
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Mock data for blog posts - in a real app this would come from a database
  const blogPosts = [
    {
      id: '1',
      title: 'How to Find the Best Film Crew for Your Project',
      author: 'Admin',
      date: '2023-10-10',
      status: 'Published',
      categories: ['Tips', 'Hiring']
    },
    {
      id: '2',
      title: 'The Importance of Networking in the Film Industry',
      author: 'Admin',
      date: '2023-09-25',
      status: 'Published',
      categories: ['Career', 'Networking']
    },
    {
      id: '3',
      title: 'Understanding Film Crew Roles and Responsibilities',
      author: 'Admin',
      date: '2023-09-15',
      status: 'Draft',
      categories: ['Education']
    },
    {
      id: '4',
      title: 'How to Create an Effective Crew Profile',
      author: 'Admin',
      date: '2023-08-30',
      status: 'Published',
      categories: ['Tips', 'Profile']
    }
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Blog Management</h1>
          <p className="text-gray-600 text-sm">
            Create, edit, and manage blog posts
          </p>
        </div>
        <div>
          <Link
            href="/admin/content/blog/new"
            className="px-4 py-2 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-700"
          >
            Add New Post
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
                  Author
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categories
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
              {blogPosts.map((post) => (
                <tr key={post.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{post.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{post.author}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{post.date}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {post.categories.map((category) => (
                        <span key={category} className="px-2 py-1 bg-gray-100 text-xs rounded">
                          {category}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${post.status === 'Published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/admin/content/blog/${post.id}/edit`}
                      className="text-indigo-600 hover:text-indigo-900 mr-2"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/admin/content/blog/${post.id}`}
                      className="text-gray-600 hover:text-gray-900 mr-2"
                    >
                      View
                    </Link>
                    <Link
                      href={`/admin/content/blog/${post.id}/delete`}
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
