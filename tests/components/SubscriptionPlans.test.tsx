import { beforeAll, afterAll, describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SubscriptionPlans } from '@/components/subscription/SubscriptionPlans'

// jsdom does not implement navigation: assigning window.location.href is a
// silent no-op. Swap in a plain object so the redirect target is observable.
const realLocation = window.location
beforeAll(() => {
  // @ts-expect-error test stub
  delete window.location
  // @ts-expect-error test stub
  window.location = { href: '' }
})
afterAll(() => {
  // @ts-expect-error test stub
  window.location = realLocation
})

// Stripe.js never loads in jsdom; the component only needs the promise to exist.
vi.mock('@stripe/stripe-js', () => ({ loadStripe: vi.fn().mockResolvedValue(null) }))
vi.mock('@/lib/public-env', () => ({
  publicEnv: { NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_x' },
}))

// The component signs logged-out visitors in before checkout — provide the
// navigation and session hooks it now uses.
const routerPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPush }),
}))
const sessionState: { data: unknown; status: string } = { data: null, status: 'unauthenticated' }
vi.mock('@/lib/auth/session-context', () => ({
  useSession: () => sessionState,
}))

beforeEach(() => {
  routerPush.mockClear()
  // Logged-in crew user so checkout proceeds past the auth gate
  sessionState.data = { user: { id: 'u1', name: 'Test', role: 'CREW' } }
  sessionState.status = 'authenticated'
})

const PLANS = [
  { id: 'basic', name: 'Basic', price: 499, description: 'For starters', features: ['Feature A', 'Feature B'] },
  { id: 'pro', name: 'Pro', price: 999, description: 'For pros', features: ['Feature C'] },
]

function stubFetch(responses: Record<string, unknown> = {}) {
  return vi.fn(async (url: string) => {
    const hit = Object.entries(responses).find(([prefix]) => url.includes(prefix))
    if (hit) return new Response(JSON.stringify(hit[1]), { status: 200 })
    return new Response('{}', { status: 200 })
  })
}

describe('SubscriptionPlans', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', stubFetch({
      '/api/subscriptions/plans': { plans: PLANS },
      '/api/subscriptions/manage': { subscription: null },
    }))
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders fetched plans with prices and features', async () => {
    render(<SubscriptionPlans />)
    expect(await screen.findByText('Basic')).toBeInTheDocument()
    expect(screen.getByText('Pro')).toBeInTheDocument()
    expect(screen.getByText('₹499')).toBeInTheDocument()
    expect(screen.getByText('₹999')).toBeInTheDocument()
    expect(screen.getByText('Feature A')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /subscribe now/i })).toHaveLength(2)
  })

  it('marks the active plan as "Current Plan" and disables its button', async () => {
    vi.stubGlobal('fetch', stubFetch({
      '/api/subscriptions/plans': { plans: PLANS },
      '/api/subscriptions/manage': { subscription: { planId: 'basic', status: 'ACTIVE' } },
    }))
    render(<SubscriptionPlans />)
    const current = await screen.findByRole('button', { name: /current plan/i })
    expect(current).toBeDisabled()
    expect(screen.getByTitle(/you already have this plan active/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /subscribe now/i })).toBeEnabled()
  })

  it('initiates Stripe checkout and redirects to the returned URL', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', stubFetch({
      '/api/subscriptions/plans': { plans: PLANS },
      '/api/subscriptions/manage': { subscription: null },
      '/api/stripe/checkout': { url: 'https://checkout.stripe.example/session' },
    }))
    render(<SubscriptionPlans />)
    await screen.findByText('Basic')
    await user.click(screen.getAllByRole('button', { name: /subscribe now/i })[0])

    await waitFor(() => {
      expect(window.location.href).toBe('https://checkout.stripe.example/session')
    })
    expect(fetch).toHaveBeenCalledWith('/api/stripe/checkout', expect.objectContaining({ method: 'POST' }))
    const body = JSON.parse(vi.mocked(fetch).mock.calls.at(-1)![1]!.body as string)
    expect(body).toEqual({ planId: 'basic' })
  })

  it('sends logged-out visitors to sign-in instead of checkout', async () => {
    const user = userEvent.setup()
    sessionState.data = null
    sessionState.status = 'unauthenticated'
    vi.stubGlobal('fetch', stubFetch({
      '/api/subscriptions/plans': { plans: PLANS },
      '/api/subscriptions/manage': { subscription: null },
    }))
    render(<SubscriptionPlans />)
    await screen.findByText('Basic')
    await user.click(screen.getAllByRole('button', { name: /subscribe now/i })[0])

    expect(routerPush).toHaveBeenCalledWith('/accounts?tab=signin&intent=subscribe')
    const checkoutCall = vi.mocked(fetch).mock.calls.find(([u]) => String(u).includes('/api/stripe/checkout'))
    expect(checkoutCall).toBeUndefined()
  })

  it('falls back to Razorpay when Stripe checkout fails', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/api/subscriptions/plans')) return new Response(JSON.stringify({ plans: PLANS }), { status: 200 })
      if (url.includes('/api/subscriptions/manage')) return new Response(JSON.stringify({ subscription: null }), { status: 200 })
      if (url.includes('/api/stripe/checkout')) return new Response(JSON.stringify({ error: 'stripe unavailable' }), { status: 500 })
      if (url.includes('/api/subscriptions/create')) {
        return new Response(JSON.stringify({ key: 'rzp_test', subscription: { id: 'sub_rp_1', notes: {}, email: 'a@b.co' } }), { status: 200 })
      }
      return new Response('{}', { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)
    render(<SubscriptionPlans />)
    await screen.findByText('Basic')
    await user.click(screen.getAllByRole('button', { name: /subscribe now/i })[0])

    await waitFor(() => {
      const createCall = fetchMock.mock.calls.find(([u]) => String(u).includes('/api/subscriptions/create'))
      expect(createCall).toBeTruthy()
    })
  })
})
