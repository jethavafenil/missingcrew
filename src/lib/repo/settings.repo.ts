import { getServiceClient } from '@/lib/repo/client'
import { now, throwOnError } from '@/lib/repo/helpers'

export async function get<T = Record<string, unknown>>(key: string): Promise<T | null> {
  const { data, error } = await getServiceClient().from('site_settings').select('value').eq('key', key).maybeSingle()
  throwOnError('settings.get', error)
  return data ? ((data as { value: T }).value ?? null) : null
}

export async function set(key: string, value: Record<string, unknown>): Promise<void> {
  const { error } = await getServiceClient().from('site_settings').upsert({ key, value, updated_at: now().toISOString() }, { onConflict: 'key' })
  throwOnError('settings.set', error)
}

// Admin switch on: every crew member whose trial is missing or over gets a fresh trial.
export async function grantTrialToAllCrew(trialEnds: Date): Promise<void> {
  const db = getServiceClient()
  const { error } = await db
    .from('crew_profiles')
    .update({ trial_ends: trialEnds.toISOString(), updated_at: now().toISOString() })
    .eq('subscription_tier', 'FREE_TRIAL')
    .or(`trial_ends.is.null,trial_ends.lt.${now().toISOString()}`)
  throwOnError('settings.grantTrialToAllCrew', error)
}
