'use client'

import { ProjectCard } from './ProjectCard'

interface Project {
  id: string
  projectName: string
  projectType: string
  rolesNeeded: Array<string | { role: string, count?: number }>
  shootStartDate: string
  shootEndDate: string
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
}

export function ProjectCardWrapper({ project, onApply }: ProjectCardWrapperProps) {
  return <ProjectCard project={project} onApply={onApply} />
}
