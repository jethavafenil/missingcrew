import { NextResponse } from 'next/server'
import { subscriptionRepo } from '@/lib/repo'

export async function GET() {
  try {
    const plans = await subscriptionRepo.findPlans()

    return NextResponse.json({ plans })
  } catch (error) {
    console.error('Error fetching subscription plans:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}