'use client'

import { ProjectCard } from './ProjectCard'

interface Project {
  id: string
  projectName: string
  projectType: string
  rolesNeeded: Array<string | { role: string, count?: number }>
  shootStartDate: string | null
  shootEndDate: string | null
  budgetMin?: number | null
  budgetMax?: number | null
  budgetFixed?: boolean | null
  productionHouse?: string | null
  tags?: string[]
  location: string
  description: string
  questions: string[]
  employer: {
    user: {
      name: string
    }
  }
  _count: {
    applications: number
  }
}

interface ProjectCardWrapperProps {
  project: Project
  onApply?: () => void
  initialHasApplied?: boolean
}

export function ProjectCardWrapper({ project, onApply, initialHasApplied }: ProjectCardWrapperProps) {
  return <ProjectCard project={project} onApply={onApply} initialHasApplied={initialHasApplied} />
}
