'use client'

import { useEffect, useState } from 'react'

export default function PlansSettingsPage() {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [grantTrial, setGrantTrial] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/settings/plans')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Could not load the setting'))))
      .then((d) => setEnabled(d.paidPlansEnabled))
      .catch((e) => setError(e.message))
  }, [])

  const save = async (next: boolean) => {
    if (next && !window.confirm('Turn on trials and paid plans? Crew will see pricing and upgrade prompts and limits start to apply.')) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch('/api/admin/settings/plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paidPlansEnabled: next, grantTrial: next && grantTrial }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'Could not save')
      setEnabled(next)
      setMessage(next ? 'Paid plans and trials are now ON.' : 'Everything is free again.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">Free mode and paid plans</h1>
      <p className="mt-1 text-sm text-gray-600">Control when trials and payments start. Until you turn them on, the whole site is free.</p>

      <div className="mt-6 rounded-lg bg-white p-6 shadow">
        {enabled === null && !error && <p className="text-gray-500">Loading...</p>}
        {enabled !== null && (
          <>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold">{enabled ? 'Paid plans and trials are ON' : 'Everything is FREE'}</p>
                <p className="text-sm text-gray-600">
                  {enabled
                    ? 'New and existing crew follow the trial, the monthly application limit and the pricing page.'
                    : 'No trial, no pricing or upgrade prompts, unlimited applications for every crew member, PRO badge for everyone.'}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold text-white ${enabled ? 'bg-indigo-600' : 'bg-emerald-600'}`}>{enabled ? 'ON' : 'FREE'}</span>
            </div>

            {!enabled && (
              <label className="mt-4 flex items-start gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={grantTrial} onChange={(e) => setGrantTrial(e.target.checked)} className="mt-0.5 h-4 w-4" />
                <span>When turning plans on, give every crew member a fresh 2-month free trial (recommended)</span>
              </label>
            )}

            <button
              type="button"
              disabled={busy}
              onClick={() => save(!enabled)}
              className={`mt-5 rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${enabled ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {busy ? 'Saving...' : enabled ? 'Switch back to free' : 'Turn on trials and paid plans'}
            </button>
          </>
        )}
        {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}
