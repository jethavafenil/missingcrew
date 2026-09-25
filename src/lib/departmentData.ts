interface Department {
  department: string;
  roles: string[];
}

interface DepartmentData {
  filmCrewDepartmentsAndRoles: Department[];
}

import { readFileSync } from 'fs'
import { join } from 'path'

export function getDepartments(): Department[] {
  const filePath = join(process.cwd(), 'public', 'indian-profiles-and-projects.json')
  const raw = readFileSync(filePath, 'utf-8')
  const data = JSON.parse(raw) as DepartmentData
  return data.filmCrewDepartmentsAndRoles
}
