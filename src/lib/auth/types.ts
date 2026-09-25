import type { UserRole } from '@/lib/repo/types'

// App-level session shape, mirroring the NextAuth session (session.user.id is
// the public.users id, not the auth.users uuid) so call sites swap mechanically.
export interface SessionUser {
  id: string
  authId: string
  name: string | null
  email: string
  image: string | null
  role: UserRole
  hasProfile: boolean
  createdAt: Date
}

export interface AppSession {
  user: SessionUser
  expires: string
}
