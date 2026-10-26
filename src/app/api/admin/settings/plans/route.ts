import { revalidateTag } from 'next/cache'
import { z } from 'zod'
import { settingsRepo } from '@/lib/repo'
import { handle } from '@/lib/api/handler'
import { parseBody } from '@/lib/api/body'
import { requireRole } from '@/lib/api/auth'
import { trialEndsFromNow } from '@/lib/subscription/access'

// GET: current switch. PUT: turn paid plans / trials on or off (admin only).
// Turning them ON can also give every crew member a fresh 2-month trial, so nobody is
// suddenly limited the moment the switch flips.
export const GET = handle(async () => {
  await requireRole('ADMIN')
  const v = await settingsRepo.get<{ paidPlansEnabled?: boolean }>('plans')
  return { paidPlansEnabled: v?.paidPlansEnabled === true }
})

export const PUT = handle(async (request) => {
  await requireRole('ADMIN')
  const { paidPlansEnabled, grantTrial } = await parseBody(
    request,
    z.object({ paidPlansEnabled: z.boolean(), grantTrial: z.boolean().optional().default(false) }),
  )
  const before = await settingsRepo.get<{ paidPlansEnabled?: boolean }>('plans')
  await settingsRepo.set('plans', { paidPlansEnabled })
  if (paidPlansEnabled && before?.paidPlansEnabled !== true && grantTrial) {
    await settingsRepo.grantTrialToAllCrew(trialEndsFromNow())
    revalidateTag('crew-profiles', { expire: 0 })
  }
  revalidateTag('site-settings', { expire: 0 })
  return { paidPlansEnabled }
})
