import { getSession } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function MediaLibrary() {
  const session = await getSession()

  // If not logged in, redirect to admin sign in page
  if (!session) {
    redirect('/auth/admin-signin')
  }

  // If not admin, redirect to dashboard
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Mock data for media files - in a real app this would come from a database or storage service
  const mediaFiles = [
    {
      id: '1',
      name: 'crew-working-on-set.jpg',
      type: 'image/jpeg',
      size: '2.4 MB',
      uploaded: '2023-10-05',
      url: '/images/crew-working-on-set.jpg'
    },
    {
      id: '2',
      name: 'film-equipment.pdf',
      type: 'application/pdf',
      size: '1.2 MB',
      uploaded: '2023-09-20',
      url: '/documents/film-equipment.pdf'
    },
    {
      id: '3',
      name: 'production-meeting.mp4',
      type: 'video/mp4',
      size: '15.6 MB',
      uploaded: '2023-09-10',
      url: '/videos/production-meeting.mp4'
    },
    {
      id: '4',
      name: 'company-logo.png',
      type: 'image/png',
      size: '456 KB',
      uploaded: '2023-08-25',
      url: '/images/company-logo.png'
    },
    {
      id: '5',
      name: 'crew-profiles.xlsx',
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: '892 KB',
      uploaded: '2023-08-15',
      url: '/documents/crew-profiles.xlsx'
    }
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Media Library</h1>
          <p className="text-gray-600 text-sm">
            Upload, manage, and organize media files
          </p>
        </div>
        <div>
          <Link
            href="/admin/content/media/upload"
            className="px-4 py-2 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-700"
          >
            Upload Files
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6">
          {mediaFiles.map((file) => (
            <div key={file.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="h-32 bg-gray-100 flex items-center justify-center">
                {file.type.startsWith('image/') ? (
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ) : file.type.startsWith('video/') ? (
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
              </div>
              <div className="p-4">
                <div className="text-sm font-medium text-gray-900 truncate mb-1">{file.name}</div>
                <div className="text-xs text-gray-500 mb-2">{file.type}</div>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">{file.size}</div>
                  <div className="text-xs text-gray-500">{file.uploaded}</div>
                </div>
                <div className="mt-3 flex space-x-2">
                  <Link
                    href={file.url}
                    target="_blank"
                    className="text-xs text-indigo-600 hover:text-indigo-900"
                  >
                    View
                  </Link>
                  <Link
                    href={`/admin/content/media/${file.id}/edit`}
                    className="text-xs text-gray-600 hover:text-gray-900"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/admin/content/media/${file.id}/delete`}
                    className="text-xs text-red-600 hover:text-red-900"
                  >
                    Delete
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
