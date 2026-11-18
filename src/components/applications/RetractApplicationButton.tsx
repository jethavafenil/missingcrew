'use client'

import { useState } from 'react'
import { Undo2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface Props {
  projectId: string
  projectName: string
  // called after the application was retracted (to refresh lists / the Apply button)
  onRetracted: () => void
  className?: string
}

// A crew member can take back an application that the producer has not acted on yet.
// The producer no longer sees it, and the crew member can apply again later.
export function RetractApplicationButton({ projectId, projectName, onRetracted, className }: Props) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const retract = async () => {
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/projects/${projectId}/apply`, { method: 'DELETE' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'Could not retract your application')
      setOpen(false)
      onRetracted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not retract your application')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setError('')
          setOpen(true)
        }}
        className={`gap-1.5 border-red-200 text-red-700 hover:bg-red-50 ${className ?? ''}`}
      >
        <Undo2 className="h-4 w-4" aria-hidden="true" />
        Retract application
      </Button>

      <Dialog open={open} onOpenChange={(next) => !busy && setOpen(next)}>
        <DialogContent className="w-[94vw] max-w-md p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle>Retract your application?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-700">
            Your application to <span className="font-medium">{projectName}</span> and your bid letter will be taken back. The producer will no longer see
            them. You can apply again later if the project is still open.
          </p>
          {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>
              Keep my application
            </Button>
            <Button type="button" disabled={busy} onClick={retract} className="bg-red-600 hover:bg-red-700">
              {busy ? 'Retracting…' : 'Yes, retract'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
