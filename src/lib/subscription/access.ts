// Single source of truth for crew trial / badge / application-limit rules.
// Used by the apply route, the profile route, and the public crew APIs.

export const TRIAL_DAYS = 60
export const FREE_MONTHLY_APPLICATIONS = 10

export interface CrewAccessInput {
  subscriptionTier?: string | null
  trialEnds?: Date | string | null
}

export function trialEndsFromNow(from: Date = new Date()): Date {
  const end = new Date(from)
  end.setDate(end.getDate() + TRIAL_DAYS)
  return end
}

// An unexpired FREE_TRIAL (new signups get 60 days; referrals extend it).
export function isTrialActive(crew: CrewAccessInput, now: Date = new Date()): boolean {
  if (crew.subscriptionTier !== 'FREE_TRIAL' || !crew.trialEnds) return false
  const end = new Date(crew.trialEnds)
  return !Number.isNaN(end.getTime()) && end.getTime() > now.getTime()
}

// `paidPlansEnabled` is the admin switch (site settings). While it is off everything is free:
// every crew member has the PRO badge and applies without limit, whatever their tier or trial.

// PRO badge: paid PRO members and everyone on an active trial (everyone while plans are off).
export function hasProBadge(crew: CrewAccessInput, now: Date = new Date(), paidPlansEnabled = true): boolean {
  if (!paidPlansEnabled) return true
  return crew.subscriptionTier === 'PRO' || isTrialActive(crew, now)
}

// Applications allowed per calendar month. Unlimited for PRO, during the trial, and while plans are off.
export function monthlyApplicationLimit(crew: CrewAccessInput, now: Date = new Date(), paidPlansEnabled = true): number {
  if (!paidPlansEnabled) return Infinity
  if (crew.subscriptionTier === 'PRO' || isTrialActive(crew, now)) return Infinity
  return FREE_MONTHLY_APPLICATIONS
}
