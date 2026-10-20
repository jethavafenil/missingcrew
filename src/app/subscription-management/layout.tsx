import type { ReactNode } from 'react'
import { redirectIfWrongRole } from '@/lib/auth/role-guard'

// Crew-only section: producers are sent to their own home.
export default async function Layout({ children }: { children: ReactNode }) {
  await redirectIfWrongRole('CREW')
  return children
}
