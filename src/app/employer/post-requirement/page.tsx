'use client'

import { useState, useMemo, useEffect, useRef, Suspense } from 'react'
import { useSession } from '@/lib/auth/session-context'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { departments } from '@/lib/departments'
import { LocationAutocomplete } from '@/components/ui/location-autocomplete'

function PostRequirementClient() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('id')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingProject, setIsLoadingProject] = useState(!!projectId)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    projectName: '',
    projectType: '',
    rolesNeeded: [] as string[],
    shootStartDate: '',
    shootEndDate: '',
    location: '',
    description: '',
    questions: ['', ''],
    contactPreference: [] as string[]
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch project data if editing
  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId || !session?.user) return

      try {
        setIsLoadingProject(true)
        const response = await fetch(`/api/employer/projects/${projectId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch project')
        }

        const { project } = await response.json()
        
        // Format dates for input fields (YYYY-MM-DD)
        const formatDate = (dateString: string) => {
          const date = new Date(dateString)
          return date.toISOString().split('T')[0]
        }

        setFormData({
          projectName: project.projectName || '',
          projectType: project.projectType || '',
          rolesNeeded: Array.isArray(project.rolesNeeded) ? project.rolesNeeded : [],
          shootStartDate: formatDate(project.shootStartDate),
          shootEndDate: formatDate(project.shootEndDate),
          location: project.location || '',
          description: project.description || '',
          questions: Array.isArray(project.questions) ? project.questions : ['', ''],
          contactPreference: Array.isArray(project.contactPreference) ? project.contactPreference : []
        })
      } catch (error) {
        console.error('Error fetching project:', error)
        setError('Failed to load project data. Please try again.')
      } finally {
        setIsLoadingProject(false)
      }
    }

    fetchProject()
  }, [projectId, session])

  // Flatten all roles from departments
  const allRoles = useMemo(() => {
    return departments.flatMap(dept => dept.roles)
  }, [])

  // Filter roles based on search query
  const filteredRoles = useMemo(() => {
    if (!searchQuery.trim()) return allRoles
    const query = searchQuery.toLowerCase()
    return allRoles.filter(role => role.toLowerCase().includes(query))
  }, [searchQuery, allRoles])

  const handleRoleToggle = (role: string) => {
    setFormData(prev => ({
      ...prev,
      rolesNeeded: prev.rolesNeeded.includes(role)
        ? prev.rolesNeeded.filter(r => r !== role)
        : [...prev.rolesNeeded, role]
    }))
  }

  const handleRoleSelect = (role: string) => {
    if (!formData.rolesNeeded.includes(role)) {
      setFormData(prev => ({
        ...prev,
        rolesNeeded: [...prev.rolesNeeded, role]
      }))
    }
    setSearchQuery('')
    setShowDropdown(false)
  }

  const handleRemoveRole = (roleToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      rolesNeeded: prev.rolesNeeded.filter(role => role !== roleToRemove)
    }))
  }

  // Handle contact method toggle
  const handleContactMethodToggle = (method: string) => {
    setFormData(prev => ({
      ...prev,
      contactPreference: prev.contactPreference.includes(method)
        ? prev.contactPreference.filter(m => m !== method)
        : [...prev.contactPreference, method]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const url = projectId 
        ? `/api/employer/projects/${projectId}` 
        : '/api/employer/projects'
      const method = projectId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/employer/dashboard')
      } else {
        const data = await response.json()
        setError(data.error || `Failed to ${projectId ? 'update' : 'post'} project. Please try again.`)
      }
    } catch (error) {
      console.error('Error submitting project:', error)
      setError(`Failed to ${projectId ? 'update' : 'post'} project. Please check your connection and try again.`)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading' || isLoadingProject) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-600">{isLoadingProject ? 'Loading project...' : 'Loading...'}</p>
      </div>
    </div>
  }

  if (session?.user?.role !== 'EMPLOYER') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Alert message="Only Employer can post project" type="error" redirectTo="/" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-800 via-purple-800 to-blue-700 text-white py-12 md:py-16">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full bg-indigo-500/20 blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute top-1/3 -right-16 w-80 h-80 rounded-full bg-purple-500/20 blur-3xl animate-blob animation-delay-4000" />
          <div className="absolute -bottom-10 left-1/3 w-56 h-56 rounded-full bg-blue-500/20 blur-2xl animate-blob animation-delay-6000" />
        </div>
        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-4">
              <span className="mr-2">🎬</span>
              <span className="text-sm font-medium">Find Your Perfect Crew</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {projectId ? 'Edit Project Requirement' : 'Post Your Project Requirement'}
            </h1>
            <p className="text-lg md:text-xl text-indigo-100 max-w-2xl mx-auto">
              {projectId ? 'Update your project details and requirements' : 'Connect with talented crew members ready to bring your vision to life'}
            </p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Project Details</h2>
            <p className="text-indigo-100">{projectId ? 'Update the information below' : 'Fill in the information below to post your project'}</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
            {/* Section: Basic Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b-2 border-indigo-100">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Basic Information</h3>
              </div>

              {/* Project Name */}
              <div>
                <label htmlFor="projectName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  id="projectName"
                  value={formData.projectName}
                  onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                  className="block w-full border border-gray-300 rounded-lg shadow-sm px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  placeholder="e.g., Feature Film Production"
                  required
                />
              </div>

              {/* Project Type */}
              <div>
                <label htmlFor="projectType" className="block text-sm font-semibold text-gray-700 mb-2">
                  Project Type *
                </label>
                <select
                  id="projectType"
                  value={formData.projectType}
                  onChange={(e) => setFormData(prev => ({ ...prev, projectType: e.target.value }))}
                  className="block w-full border border-gray-300 rounded-lg shadow-sm px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white"
                  required
                >
                  <option value="">Select project type</option>
                  {PROJECT_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section: Crew Requirements */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b-2 border-indigo-100">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Crew Requirements</h3>
              </div>

              {/* Roles Needed */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Roles Needed *
                </label>
              
              {/* Search Input */}
              <div className="relative" ref={dropdownRef}>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search and select roles..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setShowDropdown(true)
                    }}
                    onFocus={() => setShowDropdown(true)}
                    className="w-full border border-gray-300 rounded-lg shadow-sm pl-11 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  />
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                
                {/* Dropdown */}
                {showDropdown && filteredRoles.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {filteredRoles.slice(0, 50).map((role, index) => (
                      <button
                        key={`${role}-${index}`}
                        type="button"
                        onClick={() => handleRoleSelect(role)}
                        className={`w-full text-left px-4 py-3 transition-colors duration-150 ${
                          formData.rolesNeeded.includes(role)
                            ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Roles */}
              {formData.rolesNeeded.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Selected Roles ({formData.rolesNeeded.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.rolesNeeded.map((role, index) => (
                      <div
                        key={`${role}-${index}`}
                        className="inline-flex items-center bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 px-4 py-2 rounded-full text-sm font-medium shadow-sm border border-indigo-200"
                      >
                        <span>{role}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRole(role)}
                          className="ml-2 text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Shoot Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="shootStartDate" className="block text-sm font-semibold text-gray-700 mb-2">
                  Shoot Start Date *
                </label>
                <input
                  type="date"
                  id="shootStartDate"
                  value={formData.shootStartDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, shootStartDate: e.target.value }))}
                  className="block w-full border border-gray-300 rounded-lg shadow-sm px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label htmlFor="shootEndDate" className="block text-sm font-semibold text-gray-700 mb-2">
                  Shoot End Date *
                </label>
                <input
                  type="date"
                  id="shootEndDate"
                  value={formData.shootEndDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, shootEndDate: e.target.value }))}
                  className="block w-full border border-gray-300 rounded-lg shadow-sm px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Location *
              </label>
              <LocationAutocomplete
                value={formData.location}
                onChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
                placeholder="Enter city, country..."
                className="block w-full border border-gray-300 rounded-lg shadow-sm px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              />
            </div>
          </div>

          {/* Section: Project Description */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-indigo-100">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Project Description</h3>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={6}
                className="block w-full border border-gray-300 rounded-lg shadow-sm px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 resize-none"
                placeholder="Describe your project in detail. Include genre, story premise, budget range, and any special requirements."
                required
              />
            </div>

            {/* Questions */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Application Questions
                <span className="text-gray-400 font-normal ml-1">(Optional)</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Ask specific questions to help evaluate applicants (e.g., &apos;What relevant experience do you have?&apos;, &apos;Why are you interested in this project?&apos;)
              </p>
              
              {formData.questions.map((question, index) => (
                <div key={index} className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-700">Question {index + 1}</span>
                    {formData.questions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newQuestions = [...formData.questions]
                          newQuestions.splice(index, 1)
                          setFormData(prev => ({ ...prev, questions: newQuestions }))
                        }}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => {
                      const newQuestions = [...formData.questions]
                      newQuestions[index] = e.target.value
                      setFormData(prev => ({ ...prev, questions: newQuestions }))
                    }}
                    className="block w-full border border-gray-300 rounded-lg shadow-sm px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    placeholder={`e.g., What relevant experience do you have for ${formData.projectType || 'this project'}?`}
                  />
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, questions: [...prev.questions, ''] }))}
                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add another question
              </button>
            </div>
          </div>

          {/* Section: Contact Preferences */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-indigo-100">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Contact Preferences</h3>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Preferred Contact Methods *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {['email', 'phone', 'whatsapp'].map((method) => (
                  <label 
                    key={method} 
                    className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      formData.contactPreference.includes(method)
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-300 hover:border-indigo-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.contactPreference.includes(method)}
                      onChange={() => handleContactMethodToggle(method)}
                      className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <div className="flex items-center gap-2">
                      {method === 'phone' && (
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      )}
                      {method === 'email' && (
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      )}
                      {method === 'whatsapp' && (
                        <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                      )}
                      <span className="text-sm font-medium text-gray-700 capitalize">{method}</span>
                    </div>
                  </label>
                ))}
              </div>
              {formData.contactPreference.length === 0 && (
                <p className="mt-3 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Please select at least one contact method
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6 border-t border-gray-200">
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            <Button 
              type="submit" 
              disabled={isLoading || formData.contactPreference.length === 0} 
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{projectId ? 'Updating Project...' : 'Posting Your Project...'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  <span>{projectId ? 'Update Project' : 'Post Your Project'}</span>
                </div>
              )}
            </Button>
            <p className="mt-4 text-center text-sm text-gray-500">
              By posting, you agree to our terms of service and privacy policy
            </p>
          </div>
        </form>
      </div>
    </div>
  </div>
  )
}

const PROJECT_TYPES = ['Ads', 'Web Series', 'Feature Films', 'Documentary', 'Music Video', 'TV Show']

export default function PostRequirement() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <PostRequirementClient />
    </Suspense>
  )
}