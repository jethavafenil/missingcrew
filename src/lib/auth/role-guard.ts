import 'server-only'
import { redirect } from 'next/navigation'
import { getSession, roleHome } from '@/lib/auth/server'

// Crew and producers (employers) have separate experiences. A signed-in user of the
// other role is sent to their own home; guests and admins pass through (pages keep
// their own sign-in handling).
export async function redirectIfWrongRole(allowed: 'CREW' | 'EMPLOYER'): Promise<void> {
  const session = await getSession()
  if (!session) return
  const role = session.user.role
  if (role === 'ADMIN' || role === allowed) return
  redirect(roleHome(role))
}
