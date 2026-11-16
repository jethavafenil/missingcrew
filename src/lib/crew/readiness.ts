// What a crew member must have on their profile before they can apply or accept a hire.
//   core: photo, 10-digit mobile number, city (needed to move to the next profile step, to apply
//         to a job, and to save the profile as complete)
//   full: core + at least one primary role + all profile steps finished (needed to accept a hire)

import { isNationalMobile, toNationalMobile } from '@/lib/phone'

export type ProfileGap = 'photo' | 'phone' | 'city' | 'roles' | 'steps'

export const GAP_LABELS: Record<ProfileGap, string> = {
  photo: 'Add a profile photo',
  phone: 'Add your 10-digit mobile number',
  city: 'Add your city',
  roles: 'Choose at least one primary role',
  steps: 'Finish all the profile steps and save',
}

export interface ReadinessInput {
  photo?: string | null
  phone?: string | null
  city?: string | null
  primaryRoles?: string[] | null
  completed?: boolean | null
}

export function coreGaps(p: ReadinessInput): ProfileGap[] {
  const gaps: ProfileGap[] = []
  if (!p.photo || !p.photo.trim()) gaps.push('photo')
  // numbers saved earlier as +91XXXXXXXXXX still count; they are shown as 10 digits
  if (!isNationalMobile(toNationalMobile(p.phone))) gaps.push('phone')
  if (!p.city || !p.city.trim()) gaps.push('city')
  return gaps
}

export function fullGaps(p: ReadinessInput): ProfileGap[] {
  const gaps = coreGaps(p)
  if (!p.primaryRoles || p.primaryRoles.filter((r) => r && r.trim()).length === 0) gaps.push('roles')
  if (!p.completed) gaps.push('steps')
  return gaps
}

export function gapMessage(gaps: ProfileGap[]): string {
  return gaps.map((g) => GAP_LABELS[g].toLowerCase()).join(', ')
}
