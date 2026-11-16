'use client'

import { Printer } from 'lucide-react'

// Opens the browser's print dialog (where "Save as PDF" is one of the choices).
export function PrintButton({ label = 'Print or save as PDF' }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 print:hidden"
    >
      <Printer className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  )
}
