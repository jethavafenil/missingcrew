import { env } from '@/lib/env'
import Razorpay from 'razorpay'

// Lazy initialization to avoid crashing builds when env vars are missing
let _razorpay: Razorpay | null = null

function hasRazorpayEnv() {
  return Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET)
}

export function getRazorpay(): Razorpay | null {
  if (!hasRazorpayEnv()) return null
  if (_razorpay) return _razorpay
  _razorpay = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID!,
    key_secret: env.RAZORPAY_KEY_SECRET!,
  })
  return _razorpay
}

interface SubscriptionNotes {
  userName?: string
  userEmail?: string
}

export async function createSubscription(planId: string, userId: string, notes?: SubscriptionNotes) {
  try {
    const client = getRazorpay()
    if (!client) {
      throw new Error('Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.')
    }

    const subscription = await client.subscriptions.create({
      plan_id: planId,
      total_count: 12, // 12 months
      customer_notify: 1,
      notes: {
        userId: userId,
        userName: notes?.userName || '',
        userEmail: notes?.userEmail || ''
      }
    })

    return subscription
  } catch (error) {
    console.error('Error creating Razorpay subscription:', error)
    throw error
  }
}
