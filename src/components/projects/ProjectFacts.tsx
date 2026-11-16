import { Hourglass } from 'lucide-react'
import {
  PRODUCTION_STATUS_STYLE,
  formatProductionStatus,
  formatShootDuration,
  type ProductionStatus,
} from '@/lib/projects/details'

interface ProjectFactsProps {
  projectCode?: string | null
  productionStatus?: string | null
  shootDuration?: string | null
  shootDurationCustom?: string | null
  className?: string
}

// The small facts every project shows the same way: project status, shoot duration and project ID.
export function ProjectFacts({ projectCode, productionStatus, shootDuration, shootDurationCustom, className = '' }: ProjectFactsProps) {
  const status = formatProductionStatus(productionStatus)
  const duration = formatShootDuration(shootDuration, shootDurationCustom)
  if (!status && !duration && !projectCode) return null

  return (
    <div className={`flex flex-wrap items-center gap-1.5 text-xs ${className}`}>
      {status && (
        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 font-semibold ${PRODUCTION_STATUS_STYLE[productionStatus as ProductionStatus]}`}>
          {status}
        </span>
      )}
      {duration && (
        <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white/80 px-2 py-0.5 font-medium text-gray-700">
          <Hourglass className="h-3 w-3 text-gray-500" aria-hidden="true" />
          {duration}
        </span>
      )}
      {projectCode && (
        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 font-mono font-medium text-gray-600" title="Project ID">
          {projectCode}
        </span>
      )}
    </div>
  )
}
