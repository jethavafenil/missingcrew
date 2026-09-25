import { env } from '@/lib/env'
import type { Metadata } from 'next'

export default function Head() {
  const baseUrl = env.NEXT_PUBLIC_SITE_URL || 'https://missingcrew.vercel.app'
  return (
    <>
      <meta name="robots" content="index,follow" />
      <link rel="canonical" href={`${baseUrl}/projects`} />
    </>
  )
}
