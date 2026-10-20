import type { ReactNode } from 'react'
import { redirectIfWrongRole } from '@/lib/auth/role-guard'

// Producer-only section: crew members are sent to their own home.
export default async function EmployerLayout({ children }: { children: ReactNode }) {
  await redirectIfWrongRole('EMPLOYER')
  return children
}
