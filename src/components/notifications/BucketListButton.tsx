'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { Heart } from 'lucide-react'
import { useSession } from '@/lib/auth/session-context'
import { swrFetcher } from '@/lib/swr'

// Producers: shortcut to the bucket list, next to the notification bell, with a count.
export function BucketListButton() {
  const { data: session } = useSession()
  const isProducer = session?.user?.role === 'EMPLOYER'
  const { data } = useSWR<{ wishlists: unknown[] }>(isProducer ? '/api/wishlist' : null, swrFetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 15000,
  })
  if (!isProducer) return null
  const count = data?.wishlists?.length ?? 0

  return (
    <Link
      href="/employer/wishlist"
      aria-label={`Open bucket list${count ? ` (${count})` : ''}`}
      title="Bucket list"
      className="relative rounded-full p-2 text-gray-700 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
    >
      <Heart className="h-6 w-6" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-xs font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  )
}
