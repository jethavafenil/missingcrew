'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function ImportClient() {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file first' })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      // Read the file content
      const fileContent = await file.text()
      const jsonData = JSON.parse(fileContent)

      // Send the data to the API
      const response = await fetch('/api/admin/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData),
      })

      const result = await response.json()

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `Import successful! ${result.results.usersCreated} users, ${result.results.crewProfilesCreated} crew profiles, ${result.results.employerProfilesCreated} employer profiles, and ${result.results.projectsCreated} projects were created.`
        })

        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        setFile(null)

        // Refresh the page after a short delay
        setTimeout(() => {
          router.refresh()
        }, 2000)
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to import data'
        })
      }
    } catch (error) {
      console.error('Error importing data:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'An unknown error occurred'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Import Demo Data</h1>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Instructions</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Prepare a JSON file with the following structure:</li>
            <li className="pl-4">
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`{
  "crewProfiles": [...],
  "employerProfiles": [...],
  "projects": [...]
}`}</pre>
            </li>
            <li>Download a sample template: <a href="/indian-profiles-and-projects.json" download className="text-blue-600 hover:underline">indian-profiles-and-projects.json</a></li>
            <li>Upload the file using the form below</li>
          </ol>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                JSON File
              </label>
              <input
                id="file"
                name="file"
                type="file"
                accept=".json"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              {file && (
                <p className="mt-2 text-sm text-gray-500">
                  Selected file: {file.name}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading || !file}
                className={`px-4 py-2 rounded-md text-sm font-medium
                  ${isLoading || !file
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Importing...
                  </>
                ) : 'Import Data'}
              </button>
            </div>
          </form>

          {message && (
            <div className={`mt-4 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <p>{message.text}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
