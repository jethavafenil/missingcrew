"use client"

import { useState, type ChangeEvent, type FormEvent } from 'react'

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function validateEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!form.name || form.name.length < 2) {
      setError('Please enter your full name.')
      return
    }
    if (!validateEmail(form.email)) {
      setError('Please enter a valid email address.')
      return
    }
    if (!form.subject || form.subject.length < 3) {
      setError('Please enter a subject.')
      return
    }
    if (!form.message || form.message.length < 10) {
      setError('Please enter a longer message.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.message || 'Failed to send message.')
      } else {
        setSuccess(data?.message || 'Message sent successfully!')
        setForm({ name: '', email: '', subject: '', message: '' })
      }
    } catch (err) {
      setError('Something went wrong. Please try again later.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      {error && <div className="p-3 rounded-md bg-red-50 text-red-700 border border-red-200">{error}</div>}
      {success && <div className="p-3 rounded-md bg-green-50 text-green-700 border border-green-200">{success}</div>}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Your Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          required
          value={form.name}
          onChange={onChange}
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          required
          value={form.email}
          onChange={onChange}
        />
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
          Subject
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          required
          value={form.subject}
          onChange={onChange}
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          required
          value={form.message}
          onChange={onChange}
        ></textarea>
      </div>

      <div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {submitting ? 'Sending...' : 'Send Message'}
        </button>
      </div>
    </form>
  )
}
