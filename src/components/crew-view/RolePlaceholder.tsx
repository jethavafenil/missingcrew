import {
  Camera,
  Lightbulb,
  Mic,
  Brush,
  Shirt,
  Paintbrush,
  Clapperboard,
  Scissors,
  Shield,
  Drama,
  ClipboardList,
  Music,
  User,
  type LucideIcon,
} from 'lucide-react'
import { ROLE_LABELS, roleKeyFor, type RoleKey } from '@/lib/roleVisuals'

const LOOK: Record<RoleKey, { icon: LucideIcon; bg: string; fg: string }> = {
  direction: { icon: Clapperboard, bg: 'from-slate-200 to-slate-300', fg: 'text-slate-700' },
  camera: { icon: Camera, bg: 'from-indigo-100 to-indigo-300', fg: 'text-indigo-700' },
  lighting: { icon: Lightbulb, bg: 'from-amber-100 to-amber-300', fg: 'text-amber-700' },
  art: { icon: Paintbrush, bg: 'from-teal-100 to-teal-300', fg: 'text-teal-700' },
  costume: { icon: Shirt, bg: 'from-pink-100 to-pink-300', fg: 'text-pink-700' },
  makeup: { icon: Brush, bg: 'from-rose-100 to-rose-300', fg: 'text-rose-700' },
  casting: { icon: Drama, bg: 'from-purple-100 to-purple-300', fg: 'text-purple-700' },
  sound: { icon: Mic, bg: 'from-sky-100 to-sky-300', fg: 'text-sky-700' },
  production: { icon: ClipboardList, bg: 'from-emerald-100 to-emerald-300', fg: 'text-emerald-700' },
  post: { icon: Scissors, bg: 'from-violet-100 to-violet-300', fg: 'text-violet-700' },
  music: { icon: Music, bg: 'from-fuchsia-100 to-fuchsia-300', fg: 'text-fuchsia-700' },
  action: { icon: Shield, bg: 'from-orange-100 to-orange-300', fg: 'text-orange-700' },
  general: { icon: User, bg: 'from-indigo-100 to-purple-200', fg: 'text-indigo-500' },
}

// Stand-in picture for crew without a photo, chosen from their main role.
// Fills its parent; the parent decides the size and shape.
export function RolePlaceholder({ role, className = '' }: { role?: string | null; className?: string }) {
  const key = roleKeyFor(role)
  const { icon: Icon, bg, fg } = LOOK[key]
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${bg} ${fg} ${className}`}
      role="img"
      aria-label={`${ROLE_LABELS[key]} crew`}
    >
      <Icon className="h-1/2 w-1/2" strokeWidth={1.5} />
    </div>
  )
}
