import { env } from '@/lib/env'
import type { Metadata } from 'next'

export default function Head() {
  // This head is a fallback for older Next versions; modern Next uses generateMetadata
  // but we include canonical to help SEO if metadata route isn't configured.
  const baseUrl = env.NEXT_PUBLIC_SITE_URL || 'https://missingcrew.vercel.app'
  // We cannot access params at build-time here; canonical will be set on page via metadata if desired.
  return (
    <>
      <meta name="robots" content="index,follow" />
      <link rel="canonical" href={`${baseUrl}/crew`} />
    </>
  )
}
