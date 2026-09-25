import { getSession } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function GeneralSettings() {
  const session = await getSession()

  // If not logged in, redirect to admin sign in page
  if (!session) {
    redirect('/auth/admin-signin')
  }

  // If not admin, redirect to dashboard
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Mock settings data - in a real app this would come from a database
  const settings = {
    siteName: 'MissingCrew',
    siteDescription: 'Connecting filmmakers with talented crew members',
    contactEmail: 'support@missingcrew.com',
    defaultLanguage: 'English',
    maintenanceMode: false,
    googleAnalyticsId: 'UA-XXXXXXXX-X',
    privacyPolicyUrl: '/privacy-policy',
    termsOfServiceUrl: '/terms-of-service'
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">General Settings</h1>
          <p className="text-gray-600 text-sm">
            Configure general site settings
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="siteName" className="block text-sm font-medium text-gray-700 mb-1">
                  Site Name
                </label>
                <input
                  type="text"
                  id="siteName"
                  name="siteName"
                  defaultValue={settings.siteName}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="siteDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Site Description
                </label>
                <input
                  type="text"
                  id="siteDescription"
                  name="siteDescription"
                  defaultValue={settings.siteDescription}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  defaultValue={settings.contactEmail}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="defaultLanguage" className="block text-sm font-medium text-gray-700 mb-1">
                  Default Language
                </label>
                <select
                  id="defaultLanguage"
                  name="defaultLanguage"
                  defaultValue={settings.defaultLanguage}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                </select>
              </div>

              <div>
                <label htmlFor="googleAnalyticsId" className="block text-sm font-medium text-gray-700 mb-1">
                  Google Analytics ID
                </label>
                <input
                  type="text"
                  id="googleAnalyticsId"
                  name="googleAnalyticsId"
                  defaultValue={settings.googleAnalyticsId}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  id="maintenanceMode"
                  name="maintenanceMode"
                  type="checkbox"
                  defaultChecked={settings.maintenanceMode}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-700">
                  Maintenance Mode
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="privacyPolicyUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Privacy Policy URL
              </label>
              <input
                type="text"
                id="privacyPolicyUrl"
                name="privacyPolicyUrl"
                defaultValue={settings.privacyPolicyUrl}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="termsOfServiceUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Terms of Service URL
              </label>
              <input
                type="text"
                id="termsOfServiceUrl"
                name="termsOfServiceUrl"
                defaultValue={settings.termsOfServiceUrl}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="pt-6">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-700"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
