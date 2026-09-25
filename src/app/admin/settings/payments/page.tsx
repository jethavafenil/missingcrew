import { env } from '@/lib/env'
import { getSession } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function PaymentSettings() {
  const session = await getSession()

  // If not logged in, redirect to admin sign in page
  if (!session) {
    redirect('/auth/admin-signin')
  }

  // If not admin, redirect to dashboard
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Payment settings from environment variables
  const paymentSettings = {
    razorpayConfigured: Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET),
    razorpayKeyId: env.RAZORPAY_KEY_ID || '',
    currency: 'INR',
    taxRate: 18,
    testMode: env.NODE_ENV !== 'production'
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Payment Settings</h1>
          <p className="text-gray-600 text-sm">
            Configure payment gateways and settings
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Payment Configuration</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Payment gateway credentials are configured via environment variables (.env file).
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Razorpay Status */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Razorpay Integration</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Configuration Status</p>
                    <p className="text-xs text-gray-500 mt-1">Environment variables: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET</p>
                  </div>
                  <div>
                    {paymentSettings.razorpayConfigured ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Configured
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Not Configured
                      </span>
                    )}
                  </div>
                </div>

                {paymentSettings.razorpayConfigured && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 mb-2">Key ID (Public)</p>
                    <code className="text-xs text-gray-600 bg-white px-3 py-2 rounded border border-gray-200 inline-block">
                      {paymentSettings.razorpayKeyId}
                    </code>
                  </div>
                )}

                <div className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>Setup Instructions:</strong>
                  </p>
                  <ol className="text-sm text-blue-700 mt-2 space-y-1 list-decimal list-inside">
                    <li>Add RAZORPAY_KEY_ID to your .env file</li>
                    <li>Add RAZORPAY_KEY_SECRET to your .env file</li>
                    <li>Restart your development server</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* General Settings */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">General Settings</h2>
              
              <form className="space-y-4">
                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    defaultValue={paymentSettings.currency}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="INR">Indian Rupee (INR)</option>
                    <option value="USD">US Dollar (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="GBP">British Pound (GBP)</option>
                    <option value="CAD">Canadian Dollar (CAD)</option>
                    <option value="AUD">Australian Dollar (AUD)</option>
                  </select>
                </div>

              <div>
                <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700 mb-1">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  id="taxRate"
                  name="taxRate"
                  defaultValue={paymentSettings.taxRate}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

                <div className="flex items-center">
                  <input
                    id="testMode"
                    name="testMode"
                    type="checkbox"
                    defaultChecked={paymentSettings.testMode}
                    disabled
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="testMode" className="ml-2 block text-sm text-gray-700">
                    Test Mode <span className="text-xs text-gray-500">(based on NODE_ENV)</span>
                  </label>
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
      </div>
    </div>
  )
}
