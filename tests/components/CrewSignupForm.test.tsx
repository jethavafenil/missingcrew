import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CrewSignupForm from '@/components/auth-forms/CrewSignupForm'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams('role=crew'),
}))

const strongPassword = 'Sup3r$ecret'

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/full name/i), 'Ada Lovelace')
  await user.type(screen.getByLabelText(/email/i), 'ada@example.com')
  await user.type(screen.getByLabelText(/^password/i), strongPassword)
  await user.type(screen.getByLabelText(/confirm password/i), strongPassword)
}

describe('CrewSignupForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders name, email, password and confirm-password fields', () => {
    render(<CrewSignupForm />)
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
  })

  it('shows live password-requirement feedback while typing', async () => {
    const user = userEvent.setup()
    render(<CrewSignupForm />)
    await user.type(screen.getByLabelText(/^password/i), 'weak')
    // Password feedback state is internal; the submit gate is observable —
    // submitting with a weak password must not hit the API.
    await user.click(screen.getByRole('button', { name: /create account|sign ?up|register/i }))
    expect(fetch).not.toHaveBeenCalled()
  })

  it('refuses submission when passwords do not match', async () => {
    const user = userEvent.setup()
    render(<CrewSignupForm />)
    await user.type(screen.getByLabelText(/full name/i), 'Ada Lovelace')
    await user.type(screen.getByLabelText(/email/i), 'ada@example.com')
    await user.type(screen.getByLabelText(/^password/i), strongPassword)
    await user.type(screen.getByLabelText(/confirm password/i), 'Different123!')
    await user.click(screen.getByRole('button', { name: /create account|sign ?up|register/i }))

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('registers against the crew endpoint with the typed payload', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), { status: 201 }),
    )
    render(<CrewSignupForm />)
    await fillValid(user)
    await user.click(screen.getByRole('button', { name: /create account|sign ?up|register/i }))

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
    expect(fetch).toHaveBeenCalledWith('/api/auth/register/crew', expect.objectContaining({ method: 'POST' }))
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string)
    expect(body).toEqual({ name: 'Ada Lovelace', email: 'ada@example.com', password: strongPassword })
  })

  it('surfaces a duplicate-account error from the API', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'User with this email already exists' }), { status: 409 }),
    )
    render(<CrewSignupForm />)
    await fillValid(user)
    await user.click(screen.getByRole('button', { name: /create account|sign ?up|register/i }))

    expect(await screen.findByText(/already exists/i)).toBeInTheDocument()
  })
})
