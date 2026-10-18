'use client'

import { useState } from 'react'

// Shown under a "not verified" sign-in error. Always reports the same neutral
// result (the API doesn't reveal whether the address exists).
export default function ResendVerification({ email }: { email: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const resend = async () => {
    if (!email) return
    setState('sending')
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setState(res.ok ? 'sent' : 'error')
    } catch {
      setState('error')
    }
  }

  if (state === 'sent') {
    return <p className="mb-4 text-sm text-green-700">Verification email sent. Please check your inbox (and spam folder).</p>
  }

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={resend}
        disabled={state === 'sending' || !email}
        className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
      >
        {state === 'sending' ? 'Sending…' : 'Resend verification email'}
      </button>
      {state === 'error' && <p className="mt-1 text-xs text-red-600">Could not send the email. Please try again shortly.</p>}
    </div>
  )
}
