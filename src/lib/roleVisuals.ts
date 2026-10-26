// Which department picture a crew member without a photo gets, from their main role.
// Roles are matched against the department list first, then by keyword (profiles often hold
// shorter names such as "Cinematographer" or "Video Editor").

import { departments } from '@/lib/departments'

export type RoleKey =
  | 'direction'
  | 'camera'
  | 'lighting'
  | 'art'
  | 'costume'
  | 'makeup'
  | 'casting'
  | 'sound'
  | 'production'
  | 'post'
  | 'music'
  | 'action'
  | 'general'

const DEPARTMENT_KEYS: Array<[string, RoleKey]> = [
  ['direction', 'direction'],
  ['camera', 'camera'],
  ['lighting', 'lighting'],
  ['art', 'art'],
  ['costume', 'costume'],
  ['makeup', 'makeup'],
  ['casting', 'casting'],
  ['sound', 'sound'],
  ['post-production', 'post'],
  ['technical support', 'post'],
  ['music', 'music'],
  ['action', 'action'],
  ['production', 'production'],
]

const KEYWORDS: Array<[RegExp, RoleKey]> = [
  [/stunt|action|safety|fight/, 'action'],
  [/music|playback|composer|singer/, 'music'],
  [/sound|boom|foley|audio|mixer|recordist/, 'sound'],
  [/makeup|make-up|hair|prosthetic/, 'makeup'],
  [/costume|wardrobe|stylist|tailor/, 'costume'],
  [/light|gaffer|grip|electric/, 'lighting'],
  [/camera|cinemat|photograph|dop|steadicam|drone|gimbal|focus|clapper/, 'camera'],
  [/edit|colou?rist|vfx|dit\b|dubbing|post|grading|motion graphic|animation/, 'post'],
  [/art\b|set |set$|prop|design|paint|carpent|construction|decor/, 'art'],
  [/cast|actor|actress|artist|model/, 'casting'],
  [/direct|script|continuity|assistant director|\bad\b|floor manager/, 'direction'],
  [/produc|manager|coordinator|account|runner|catering|driver|transport|unit|location/, 'production'],
]

export function roleKeyFor(role: string | null | undefined): RoleKey {
  const r = (role || '').trim().toLowerCase()
  if (!r) return 'general'

  const dept = departments.find((d) => d.roles.some((x) => x.toLowerCase() === r))
  if (dept) {
    const name = dept.department.toLowerCase()
    const hit = DEPARTMENT_KEYS.find(([needle]) => name.includes(needle))
    if (hit) return hit[1]
  }
  for (const [re, key] of KEYWORDS) if (re.test(r)) return key
  return 'general'
}

export const ROLE_LABELS: Record<RoleKey, string> = {
  direction: 'Direction',
  camera: 'Camera',
  lighting: 'Lighting & Grip',
  art: 'Art',
  costume: 'Costume',
  makeup: 'Makeup & Hair',
  casting: 'Casting',
  sound: 'Sound',
  production: 'Production',
  post: 'Post-production',
  music: 'Music',
  action: 'Action & Safety',
  general: 'Film crew',
}
