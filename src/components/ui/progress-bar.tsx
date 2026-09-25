'use client'

import { cn } from "@/lib/utils"

interface ProgressBarProps {
  steps: number
  currentStep: number
  className?: string
}

export function ProgressBar({ steps, currentStep, className }: ProgressBarProps) {
  const progress = ((currentStep - 1) / (steps - 1)) * 100

  return (
    <div className={cn("w-full bg-gray-200 rounded-full h-2", className)}>
      <div 
        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}