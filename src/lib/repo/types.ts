import type { SupabaseClient } from '@/lib/repo/client'

// Enum value mirrors (PostgREST returns enum columns as plain strings).
export type UserRole = 'CREW' | 'EMPLOYER' | 'ADMIN'
export type SubscriptionTier = 'FREE_TRIAL' | 'BASIC' | 'PRO'
export type ProjectStatus = 'OPEN' | 'CLOSED' | 'FILLED'
export type ApplicationStatus = 'PENDING' | 'SHORTLISTED' | 'REJECTED' | 'HIRED'
export type SubscriptionStatus = 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'UNPAID'
export type NotificationType =
  | 'APPLICATION_RECEIVED'
  | 'APPLICATION_STATUS_CHANGED'
  | 'PROJECT_POSTED'
  | 'SUBSCRIPTION_EXPIRING'
  | 'MESSAGE_RECEIVED'
  | 'CONNECTION_REQUEST'
  | 'CONNECTION_ACCEPTED'
export type ConnectionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'

// Identity of the requester driving a repository call.
// - role 'ADMIN' => service-role client (bypasses RLS, cross-user reads)
// - otherwise    => anon/auth-scoped client (RLS enforced in the query)
export interface Requester {
  userId: string
  role: UserRole
}

export type AdminRequester = Requester & { role: 'ADMIN' }

// Row + relation shapes (camelCase, mirroring the Prisma-era app shapes so
// call sites can swap mechanically). Timestamps are Date, matching Prisma.
export interface UserRow {
  id: string
  authId: string | null
  name: string | null
  email: string
  emailVerified: Date | null
  image: string | null
  phone: string | null
  phoneVerified: boolean
  role: UserRole
  createdAt: Date
  updatedAt: Date
  password: string | null
  crewProfile?: CrewProfileRow | null
  employerProfile?: EmployerProfileRow | null
  subscriptions?: SubscriptionWithPlanRow[]
}

export interface CrewProfileRow {
  id: string
  userId: string
  photo: string | null
  city: string | null
  budgetRangeMin: number | null
  budgetRangeMax: number | null
  budgetFlexible: boolean
  primaryRoles: string[]
  yearsExperience: string | null
  location: string | null
  availableToTravel: boolean
  availability: boolean
  availabilityStart: Date | null
  availabilityEnd: Date | null
  projectTypes: string[]
  dailyBudgetMin: number | null
  dailyBudgetMax: number | null
  languages: Record<string, unknown> | string[]
  imdbLink: string | null
  portfolioLinks: string[]
  pastProjects: unknown | null
  referredBy: string | null
  contactWhatsApp: string | null
  termsAgreed: boolean
  subscriptionTier: SubscriptionTier
  trialEnds: Date | null
  completed: boolean
  createdAt: Date
  updatedAt: Date
  user?: Partial<UserRow>
}

export interface EmployerProfileRow {
  id: string
  userId: string
  companyName: string | null
  companyWebsite: string | null
  completed: boolean
  createdAt: Date
  updatedAt: Date
  user?: Partial<UserRow>
  projects?: ProjectWithEmployerRow[]
}

export interface ProjectRow {
  id: string
  employerId: string
  projectName: string
  projectType: string
  rolesNeeded: string[]
  shootStartDate: Date
  shootEndDate: Date
  location: string
  budgetPerRole: unknown | null
  description: string
  questions: Record<string, unknown> | string[]
  contactPreference: Record<string, unknown> | string[]
  status: ProjectStatus
  createdAt: Date
  updatedAt: Date
  _count?: { applications: number }
  applications?: ApplicationWithCrewRow[]
}

export interface ProjectWithEmployerRow extends ProjectRow {
  employer?: EmployerProfileWithUserRow
}

export interface EmployerProfileWithUserRow extends EmployerProfileRow {
  user?: Pick<UserRow, 'name' | 'image' | 'email'>
}

export interface ApplicationRow {
  id: string
  projectId: string
  crewId: string
  status: ApplicationStatus
  appliedAt: Date
  employerNotes: string | null
  crewNotes: string | null
  answers: Record<string, unknown> | string[]
}

export interface ApplicationWithProjectAndCrewRow extends ApplicationRow {
  project?: ProjectWithEmployerRow
  crew?: CrewProfileWithUserRow
  user?: Pick<UserRow, 'name' | 'email'>
}

export interface ApplicationWithCrewRow extends ApplicationRow {
  crew?: CrewProfileWithUserRow
}

export interface CrewProfileWithUserRow extends CrewProfileRow {
  user?: Pick<UserRow, 'id' | 'name' | 'email' | 'phone' | 'phoneVerified'>
}

export interface SubscriptionPlanRow {
  id: string
  name: string
  price: number
  description: string
  features: string[]
  stripePriceId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface SubscriptionRow {
  id: string
  userId: string
  planId: string
  status: SubscriptionStatus
  razorpaySubscriptionId: string | null
  razorpayPaymentId: string | null
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  stripePriceId: string | null
  currentPeriodStart: Date
  currentPeriodEnd: Date
  createdAt: Date
  updatedAt: Date
}

export interface SubscriptionWithPlanRow extends SubscriptionRow {
  plan?: Pick<SubscriptionPlanRow, 'id' | 'name' | 'price' | 'stripePriceId'>
}

export interface NotificationRow {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  data: unknown | null
  createdAt: Date
}

export interface WishlistRow {
  id: string
  userId: string
  crewId: string | null
  projectId: string | null
  createdAt: Date
  crew?: CrewProfileWithUserRow | null
  project?: ProjectWithEmployerRow | null
}

export interface ConnectionRow {
  id: string
  requesterId: string
  receiverId: string
  status: ConnectionStatus
  createdAt: Date
  updatedAt: Date
  requester?: RequesterUserRow
  receiver?: RequesterUserRow
}

export interface RequesterUserRow {
  id: string
  name: string | null
  email: string
  phone: string | null
  crewProfile?: CrewProfilePreview | null
  employerProfile?: EmployerProfilePreview | null
}

export interface CrewProfilePreview {
  id: string
  photo: string | null
  city: string | null
  primaryRoles: string[]
  yearsExperience: string | null
  location: string | null
  contactWhatsApp: string | null
  portfolioLinks: string[]
  imdbLink: string | null
}

export interface EmployerProfilePreview {
  id: string
  companyName: string | null
  companyWebsite: string | null
}

// PostgREST rows arrive with database column names (snake_case).
type RawRow = Record<string, unknown>

function asDate(v: unknown): Date | null {
  if (v == null) return null
  return v instanceof Date ? v : new Date(String(v))
}
function asBool(v: unknown): boolean {
  return v === true || v === 'true' || v === 1 || v === '1'
}
function asJsonArr<T = unknown>(v: unknown): T[] {
  if (v == null) return []
  if (Array.isArray(v)) return v as T[]
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v)
      return Array.isArray(parsed) ? (parsed as T[]) : []
    } catch {
      return []
    }
  }
  return []
}
function asJsonObj<T = unknown>(v: unknown): T {
  if (v == null) return {} as T
  if (typeof v === 'string') {
    try {
      return JSON.parse(v) as T
    } catch {
      return {} as T
    }
  }
  return v as T
}
export function asStringList(v: unknown): string[] {
  return asJsonArr<string>(v)
}
export function asOptionalString(v: unknown): string | null {
  return v == null ? null : String(v)
}

export function mapUser(r: RawRow): UserRow {
  return {
    id: r.id as string,
    authId: (r.auth_id as string) ?? null,
    name: (r.name as string) ?? null,
    email: r.email as string,
    emailVerified: asDate(r.email_verified),
    image: (r.image as string) ?? null,
    phone: (r.phone as string) ?? null,
    phoneVerified: asBool(r.phoneVerified),
    role: r.role as UserRole,
    createdAt: asDate(r.created_at)!,
    updatedAt: asDate(r.updated_at)!,
    password: (r.password as string) ?? null,
  }
}

export function mapCrewProfile(r: RawRow): CrewProfileRow {
  return {
    id: r.id as string,
    userId: r.userId as string,
    photo: (r.photo as string) ?? null,
    city: (r.city as string) ?? null,
    budgetRangeMin: (r.budget_range_min as number | null) ?? null,
    budgetRangeMax: (r.budget_range_max as number | null) ?? null,
    budgetFlexible: asBool(r.budgetFlexible),
    primaryRoles: asStringList(r.primary_roles),
    yearsExperience: (r.years_experience as string) ?? null,
    location: (r.location as string) ?? null,
    availableToTravel: asBool(r.available_to_travel),
    availability: asBool(r.availability),
    availabilityStart: asDate(r.availability_start),
    availabilityEnd: asDate(r.availability_end),
    projectTypes: asStringList(r.project_types),
    dailyBudgetMin: (r.daily_budget_min as number | null) ?? null,
    dailyBudgetMax: (r.daily_budget_max as number | null) ?? null,
    languages: (r.languages as string[]) ?? [],
    imdbLink: (r.imdb_link as string) ?? null,
    portfolioLinks: asStringList(r.portfolio_links),
    pastProjects: r.past_projects ?? null,
    referredBy: (r.referred_by as string) ?? null,
    contactWhatsApp: (r.contact_whatsapp as string) ?? null,
    termsAgreed: asBool(r.terms_agreed),
    subscriptionTier: r.subscription_tier as SubscriptionTier,
    trialEnds: asDate(r.trial_ends),
    completed: asBool(r.completed),
    createdAt: asDate(r.created_at)!,
    updatedAt: asDate(r.updated_at)!,
  }
}

export function mapEmployerProfile(r: RawRow): EmployerProfileRow {
  return {
    id: r.id as string,
    userId: r.userId as string,
    companyName: (r.company_name as string) ?? null,
    companyWebsite: (r.company_website as string) ?? null,
    completed: asBool(r.completed),
    createdAt: asDate(r.created_at)!,
    updatedAt: asDate(r.updated_at)!,
  }
}

export function mapProject(r: RawRow): ProjectRow {
  return {
    id: r.id as string,
    employerId: r.employer_id as string,
    projectName: r.project_name as string,
    projectType: r.project_type as string,
    rolesNeeded: asStringList(r.roles_needed),
    shootStartDate: asDate(r.shoot_start_date)!,
    shootEndDate: asDate(r.shoot_end_date)!,
    location: r.location as string,
    budgetPerRole: r.budget_per_role ?? null,
    description: r.description as string,
    questions: asJsonObj(r.questions),
    contactPreference: asJsonObj(r.contact_preference),
    status: r.status as ProjectStatus,
    createdAt: asDate(r.created_at)!,
    updatedAt: asDate(r.updated_at)!,
  }
}

export function mapApplication(r: RawRow): ApplicationRow {
  return {
    id: r.id as string,
    projectId: r.project_id as string,
    crewId: r.crew_id as string,
    status: r.status as ApplicationStatus,
    appliedAt: asDate(r.applied_at)!,
    employerNotes: (r.employer_notes as string) ?? null,
    crewNotes: (r.crew_notes as string) ?? null,
    answers: asJsonObj(r.answers),
  }
}

export function mapSubscriptionPlan(r: RawRow): SubscriptionPlanRow {
  return {
    id: r.id as string,
    name: r.name as string,
    price: r.price as number,
    description: r.description as string,
    features: asStringList(r.features),
    stripePriceId: (r.stripe_price_id as string) ?? null,
    createdAt: asDate(r.created_at)!,
    updatedAt: asDate(r.updated_at)!,
  }
}

export function mapSubscription(r: RawRow): SubscriptionRow {
  return {
    id: r.id as string,
    userId: r.userId as string,
    planId: r.plan_id as string,
    status: r.status as SubscriptionStatus,
    razorpaySubscriptionId: (r.razorpay_subscription_id as string) ?? null,
    razorpayPaymentId: (r.razorpay_payment_id as string) ?? null,
    stripeCustomerId: (r.stripe_customer_id as string) ?? null,
    stripeSubscriptionId: (r.stripe_subscription_id as string) ?? null,
    stripePriceId: (r.stripe_price_id as string) ?? null,
    currentPeriodStart: asDate(r.current_period_start)!,
    currentPeriodEnd: asDate(r.current_period_end)!,
    createdAt: asDate(r.created_at)!,
    updatedAt: asDate(r.updated_at)!,
  }
}

export function mapNotification(r: RawRow): NotificationRow {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    type: r.type as NotificationType,
    title: r.title as string,
    message: r.message as string,
    read: asBool(r.read),
    data: r.data ?? null,
    createdAt: asDate(r.created_at)!,
  }
}

export function mapWishlist(r: RawRow): WishlistRow {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    crewId: (r.crew_id as string) ?? null,
    projectId: (r.project_id as string) ?? null,
    createdAt: asDate(r.created_at)!,
  }
}

export function mapConnection(r: RawRow): ConnectionRow {
  return {
    id: r.id as string,
    requesterId: r.requester_id as string,
    receiverId: r.receiver_id as string,
    status: r.status as ConnectionStatus,
    createdAt: asDate(r.created_at)!,
    updatedAt: asDate(r.updated_at)!,
  }
}

// Shape helper for nested relations pulled out of a joined PostgREST payload.
function first<T>(v: unknown): T | null {
  if (v == null) return null
  if (Array.isArray(v)) return (v.length ? (v[0] as T) : null)
  return v as T
}
function many<T>(v: unknown): T[] {
  if (v == null) return []
  if (Array.isArray(v)) return v as T[]
  return [v as T]
}

export { asDate, asBool, first, many }