'use client'

import useSWR from 'swr'
import { swrFetcher } from '@/lib/swr'

// `paidPlansEnabled` is undefined while loading and false (free for everyone) until an admin
// turns plans on. Pages should only show trial banners, pricing or upgrade prompts when it is true.
export function usePaidPlansEnabled(): boolean | undefined {
  const { data } = useSWR<{ paidPlansEnabled: boolean }>('/api/settings/public', swrFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  })
  return data?.paidPlansEnabled
}
