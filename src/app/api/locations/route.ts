import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { publicEnv } from '@/lib/public-env'
import { rateLimitMiddleware } from '@/lib/rateLimiter'
import { logError } from '@/lib/api/logger'
import { normalizeLocationQuery, simplifySuggestions } from '@/lib/locations'

// GET /api/locations?q=mum  ->  { suggestions: [{ place_id, display_name, lat, lon }], configured }
// Proxy for LocationIQ autocomplete: the key never reaches the browser, answers are cached,
// and every visitor is rate limited so the free plan lasts.
const KEY = () => env.LOCATIONIQ_API_KEY || publicEnv.NEXT_PUBLIC_LOCATIONIQ_API_KEY

export async function GET(request: NextRequest) {
  const q = normalizeLocationQuery(new URL(request.url).searchParams.get('q'))
  if (!q) return NextResponse.json({ suggestions: [], configured: Boolean(KEY()) })

  const key = KEY()
  if (!key) {
    // Not configured: the box still works as a plain text field.
    return NextResponse.json({ suggestions: [], configured: false }, { headers: { 'Cache-Control': 'no-store' } })
  }

  const limited = await rateLimitMiddleware(request, 'location-search', { policy: { points: 60, duration: 60 } })
  if (limited) return limited

  try {
    const url =
      `https://api.locationiq.com/v1/autocomplete?key=${encodeURIComponent(key)}` +
      `&q=${encodeURIComponent(q)}&limit=6&format=json&dedupe=1&tag=place:city,place:town,place:village,place:suburb`
    const res = await fetch(url, { signal: AbortSignal.timeout(6000), next: { revalidate: 86400 } })
    if (res.status === 404) {
      // LocationIQ answers 404 when nothing matches
      return NextResponse.json({ suggestions: [], configured: true }, { headers: { 'Cache-Control': 'public, s-maxage=3600' } })
    }
    if (!res.ok) {
      logError('locations.upstream_failed', new Error(`status ${res.status}`), { status: res.status })
      return NextResponse.json({ suggestions: [], configured: true, error: res.status === 429 ? 'busy' : 'unavailable' }, { headers: { 'Cache-Control': 'no-store' } })
    }
    const suggestions = simplifySuggestions(await res.json())
    return NextResponse.json({ suggestions, configured: true }, { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } })
  } catch (error) {
    logError('locations.fetch_failed', error)
    return NextResponse.json({ suggestions: [], configured: true, error: 'unavailable' }, { headers: { 'Cache-Control': 'no-store' } })
  }
}
