import 'server-only'
import { unstable_cache } from 'next/cache'
import { settingsRepo } from '@/lib/repo'

export interface PlanSettings {
  paidPlansEnabled: boolean
}

// Everything is free until an admin switches paid plans on. Any problem reading the
// setting also means "free", so a database hiccup can never lock crew out.
export const getPlanSettings = unstable_cache(
  async (): Promise<PlanSettings> => {
    try {
      const v = await settingsRepo.get<{ paidPlansEnabled?: boolean }>('plans')
      return { paidPlansEnabled: v?.paidPlansEnabled === true }
    } catch (error) {
      console.error('Reading plan settings failed, treating plans as off:', error)
      return { paidPlansEnabled: false }
    }
  },
  ['site-settings-plans'],
  { revalidate: 60, tags: ['site-settings'] },
)

export async function arePaidPlansEnabled(): Promise<boolean> {
  return (await getPlanSettings()).paidPlansEnabled
}
