// Typed Supabase repository layer (P4.2). One module per domain; every function
// returns the Prisma-era camelCase shapes (Date objects for timestamps) so
// call sites swap mechanically. Enforcement is RLS-aware in app code:
// user-scoped functions take a Requester and filter by it; admin functions
// require role 'ADMIN'. The service client bypasses RLS (per the approved
// design); public reads can opt into the anon client.
//
// NOTE: callers are NOT wired to these yet — P4.3 migrates them in batches.

export * as userRepo from '@/lib/repo/user.repo'
export * as crewProfileRepo from '@/lib/repo/crewProfile.repo'
export * as employerProfileRepo from '@/lib/repo/employerProfile.repo'
export * as projectRepo from '@/lib/repo/project.repo'
export * as applicationRepo from '@/lib/repo/application.repo'
export * as subscriptionRepo from '@/lib/repo/subscription.repo'
export * as notificationRepo from '@/lib/repo/notification.repo'
export * as wishlistRepo from '@/lib/repo/wishlist.repo'
export * as connectionRepo from '@/lib/repo/connection.repo'

export { assertUser, assertAdmin, currentUserId, requesterFromSession, SYSTEM_REQUESTER, type RequiresRequester, type RequiresAdmin } from '@/lib/repo/scope'
export type {
  Requester,
  UserRole,
  SubscriptionTier,
  ProjectStatus,
  ApplicationStatus,
  SubscriptionStatus,
  NotificationType,
  ConnectionStatus,
  UserRow,
  CrewProfileRow,
  CrewProfileWithUserRow,
  EmployerProfileRow,
  EmployerProfileWithUserRow,
  ProjectRow,
  ProjectWithEmployerRow,
  ApplicationRow,
  ApplicationWithCrewRow,
  ApplicationWithProjectAndCrewRow,
  SubscriptionPlanRow,
  SubscriptionRow,
  SubscriptionWithPlanRow,
  NotificationRow,
  WishlistRow,
  ConnectionRow,
} from '@/lib/repo/types'
export {
  getAnonClient,
  getServiceClient,
  type SupabaseClient,
} from '@/lib/repo/client'