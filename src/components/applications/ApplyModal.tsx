'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/ToastProvider'
import { X, Calendar, MapPin, Users, FileText, CheckCircle2, AlertCircle } from 'lucide-react'

interface Project {
  id: string
  projectName: string
  description: string
  location: string
  shootStartDate: string
  shootEndDate: string
  rolesNeeded: string[]
  questions: string[]
}

interface ApplyModalProps {
  project: Project
  onClose: () => void
  onSuccess: () => void
}

export function ApplyModal({ project, onClose, onSuccess }: ApplyModalProps) {
  const toast = useToast()
  const [answers, setAnswers] = useState<string[]>(
    project.questions.map(() => '')
  )
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ [key: number]: string }>({})
  const [showSuccess, setShowSuccess] = useState(false)

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isSubmitting, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const validateForm = () => {
    const newErrors: { [key: number]: string } = {}
    project.questions.forEach((question, index) => {
      if (question && question.trim() && !answers[index]?.trim()) {
        newErrors[index] = 'This question is required'
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please answer all required questions')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/projects/${project.id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers,
          notes
        }),
      })

      if (response.ok) {
        setShowSuccess(true)
        toast.success('Application submitted successfully!')
        setTimeout(() => {
          onSuccess()
        }, 1500)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to apply')
      }
    } catch (error) {
      console.error('Error applying:', error)
      toast.error('Failed to apply to project')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl animate-in zoom-in duration-300">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h3>
          <p className="text-gray-600">Your application has been sent to the employer. Good luck!</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose()
      }}
    >
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">Apply to Project</h2>
              <p className="text-indigo-100 text-lg">{project.projectName}</p>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-all duration-200 disabled:opacity-50"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">

          {/* Project Details */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl mb-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-gray-900">Project Overview</h3>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">{project.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Location</p>
                  <p className="text-sm text-gray-900">{project.location}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Shoot Dates</p>
                  <p className="text-sm text-gray-900">
                    {new Date(project.shootStartDate).toLocaleDateString()} - {new Date(project.shootEndDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 md:col-span-2">
                <Users className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Roles Needed</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {project.rolesNeeded.map((role, idx) => (
                      <span key={idx} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Questions */}
          {project.questions.filter((q: string) => q && typeof q === 'string' && q.trim()).length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-indigo-600" />
                Employer Questions
                <span className="text-xs text-red-500 font-normal">* Required</span>
              </h3>
              {project.questions.map((question: string, index: number) => (
                question && typeof question === 'string' && question.trim() && (
                  <div key={index} className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="flex-1">{question}</span>
                      </span>
                    </label>
                    <textarea
                      value={answers[index]}
                      onChange={(e) => {
                        const newAnswers = [...answers]
                        newAnswers[index] = e.target.value
                        setAnswers(newAnswers)
                        // Clear error when user types
                        if (errors[index]) {
                          const newErrors = { ...errors }
                          delete newErrors[index]
                          setErrors(newErrors)
                        }
                      }}
                      rows={3}
                      className={`w-full border rounded-lg p-3 transition-all duration-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none ${
                        errors[index] 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      placeholder="Type your answer here..."
                      disabled={isSubmitting}
                    />
                    {errors[index] && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors[index]}
                      </p>
                    )}
                  </div>
                )
              ))}
            </div>
          )}

          {/* Additional Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
              <span className="text-gray-400 font-normal ml-1">(Optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 resize-none"
              placeholder="Share why you're the perfect fit for this project, relevant experience, or any additional information..."
              disabled={isSubmitting}
            />
          </div>

        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3">
            <p className="text-xs text-gray-500 text-center sm:text-left">
              Your application will be reviewed by the employer
            </p>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  'Submit Application'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
