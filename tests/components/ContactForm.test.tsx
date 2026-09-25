import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ContactForm from '@/components/contact/ContactForm'

describe('ContactForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders all fields with labels', () => {
    render(<ContactForm />)
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send message/i })).toBeEnabled()
  })

  it('validates email format before submitting', async () => {
    const user = userEvent.setup()
    render(<ContactForm />)
    await user.type(screen.getByLabelText(/your name/i), 'Ada Lovelace')
    // "ada@example" is a *valid* value for <input type="email"> per the HTML
    // spec (single-label domain), so jsdom keeps it and lets the form submit —
    // but the app's stricter regex requires a dot in the domain and must
    // reject it before any fetch happens.
    await user.type(screen.getByLabelText(/email address/i), 'ada@example')
    await user.type(screen.getByLabelText(/subject/i), 'Hello there')
    await user.type(screen.getByLabelText(/message/i), 'A sufficiently long message.')
    await user.click(screen.getByRole('button', { name: /send message/i }))

    expect(await screen.findByText(/valid email address/i)).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('enforces minimum lengths for name/subject/message', async () => {
    const user = userEvent.setup()
    render(<ContactForm />)
    await user.type(screen.getByLabelText(/your name/i), 'A')
    await user.type(screen.getByLabelText(/email address/i), 'ada@example.com')
    await user.type(screen.getByLabelText(/subject/i), 'ab')
    await user.type(screen.getByLabelText(/message/i), 'short')
    await user.click(screen.getByRole('button', { name: /send message/i }))

    expect(await screen.findByText(/full name/i)).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('submits valid input as JSON and shows the success message', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Message sent successfully!' }), { status: 200 }),
    )
    render(<ContactForm />)
    await user.type(screen.getByLabelText(/your name/i), 'Ada Lovelace')
    await user.type(screen.getByLabelText(/email address/i), 'ada@example.com')
    await user.type(screen.getByLabelText(/subject/i), 'Crew application')
    await user.type(screen.getByLabelText(/message/i), 'I would like to join your crew.')
    await user.click(screen.getByRole('button', { name: /send message/i }))

    expect(await screen.findByText(/message sent successfully/i)).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith(
      '/api/contact',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string)
    expect(body).toMatchObject({ name: 'Ada Lovelace', email: 'ada@example.com' })
    // Form resets after success.
    expect(screen.getByLabelText(/your name/i)).toHaveValue('')
  })

  it('shows the server error message on failure', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Rate limit exceeded' }), { status: 429 }),
    )
    render(<ContactForm />)
    await user.type(screen.getByLabelText(/your name/i), 'Ada Lovelace')
    await user.type(screen.getByLabelText(/email address/i), 'ada@example.com')
    await user.type(screen.getByLabelText(/subject/i), 'Crew application')
    await user.type(screen.getByLabelText(/message/i), 'I would like to join your crew.')
    await user.click(screen.getByRole('button', { name: /send message/i }))

    expect(await screen.findByText(/rate limit exceeded/i)).toBeInTheDocument()
  })
})
