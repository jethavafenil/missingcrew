'use client'

import { useState } from 'react'
import Link from 'next/link'

interface BlogPost {
  id: string
  title: string
  author: string
  date: string
  status: 'Published' | 'Draft'
  categories: string[]
  content?: string
}

export default function BlogManagement() {
  const [posts, setPosts] = useState<BlogPost[]>([
    {
      id: '1',
      title: 'How to Find the Best Film Crew for Your Project',
      author: 'Admin',
      date: '2023-10-10',
      status: 'Published',
      categories: ['Tips', 'Hiring'],
      content: 'Sample content...'
    },
    {
      id: '2',
      title: 'The Importance of Networking in the Film Industry',
      author: 'Admin',
      date: '2023-09-25',
      status: 'Published',
      categories: ['Career', 'Networking'],
      content: 'Sample content...'
    },
    {
      id: '3',
      title: 'Understanding Film Crew Roles and Responsibilities',
      author: 'Admin',
      date: '2023-09-15',
      status: 'Draft',
      categories: ['Education'],
      content: 'Sample content...'
    },
    {
      id: '4',
      title: 'How to Create an Effective Crew Profile',
      author: 'Admin',
      date: '2023-08-30',
      status: 'Published',
      categories: ['Tips', 'Profile'],
      content: 'Sample content...'
    }
  ])

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      setPosts(posts.filter(post => post.id !== id))
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Blog Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Create, edit, and manage blog posts
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/admin/blog/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-700"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add New Post
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Total Posts</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{posts.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Published</div>
          <div className="mt-1 text-2xl font-semibold text-green-600">
            {posts.filter(p => p.status === 'Published').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Drafts</div>
          <div className="mt-1 text-2xl font-semibold text-orange-600">
            {posts.filter(p => p.status === 'Draft').length}
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categories
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                    No blog posts found. Create your first post!
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{post.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">{post.author}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">{post.date}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {post.categories.map((category) => (
                          <span key={category} className="px-2 py-1 bg-gray-100 text-xs rounded">
                            {category}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        post.status === 'Published' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium space-x-3">
                      <Link
                        href={`/admin/blog/${post.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/blog/${post.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
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
