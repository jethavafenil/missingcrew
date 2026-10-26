import { NextResponse } from 'next/server'
import { getPlanSettings } from '@/lib/settings'

// Switches the pages need to know about (nothing secret): are paid plans / trials open yet?
export async function GET() {
  const plans = await getPlanSettings()
  return NextResponse.json(plans, { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } })
}
