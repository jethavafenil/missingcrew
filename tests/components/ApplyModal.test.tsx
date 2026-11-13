import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApplyModal } from '@/components/applications/ApplyModal'
import ToastProvider from '@/components/ui/ToastProvider'

const project = {
  id: 'proj-1',
  projectName: 'Indie Feature Film',
  description: 'A gritty drama shot on location.',
  location: 'Mumbai',
  shootStartDate: '2026-10-01',
  shootEndDate: '2026-11-01',
  rolesNeeded: ['Director', 'Camera'],
  questions: ['Why do you want this role?', 'Describe your experience.'],
}

function renderModal(overrides: Partial<Parameters<typeof ApplyModal>[0]> = {}) {
  const onSuccess = vi.fn()
  const onClose = vi.fn()
  render(
    <ToastProvider>
      <ApplyModal project={project} onClose={onClose} onSuccess={onSuccess} {...overrides} />
    </ToastProvider>,
  )
  return { onSuccess, onClose }
}

describe('ApplyModal', () => {
  // The modal first asks for the crew member's profile links, then posts the application.
  const profileResponse = () => new Response(JSON.stringify({ data: { portfolioLinks: ['https://vimeo.com/1', 'https://example.com/reel'], imdbLink: '', showreelUrl: '' } }), { status: 200 })
  const applyCalls = () => vi.mocked(fetch).mock.calls.filter((c) => String(c[0]).includes('/apply'))
  const mockApply = (res: Response) =>
    vi.mocked(fetch).mockImplementation(async (input) => (String(input).includes('/api/crew/profile') ? profileResponse() : res.clone()))

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => profileResponse()))
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders project summary and one input per employer question', () => {
    renderModal()
    expect(screen.getByText('Apply to Project')).toBeInTheDocument()
    expect(screen.getByText('Indie Feature Film')).toBeInTheDocument()
    expect(screen.getByText('Mumbai')).toBeInTheDocument()
    expect(screen.getByText('Director')).toBeInTheDocument()
    expect(screen.getByText('Camera')).toBeInTheDocument()
    expect(screen.getAllByPlaceholderText(/type your answer here/i)).toHaveLength(2)
    expect(screen.getByPlaceholderText(/share why you're the perfect fit/i)).toBeInTheDocument()
  })

  it('applies in one click without answering the optional questions, sending all profile links', async () => {
    const user = userEvent.setup()
    mockApply(new Response('{}', { status: 200 }))
    renderModal()
    await screen.findByText('vimeo.com')
    await user.click(screen.getByRole('button', { name: /apply now/i }))

    expect(await screen.findByText(/application submitted!/i)).toBeInTheDocument()
    const body = JSON.parse(applyCalls()[0][1]!.body as string)
    expect(body.answers).toEqual(['', ''])
    // every profile link is ticked by default, so one click sends them all
    expect(body.links).toEqual(['https://vimeo.com/1', 'https://example.com/reel'])
  })

  it('submits answers + notes to the apply endpoint and shows the success state', async () => {
    const user = userEvent.setup()
    mockApply(new Response('{}', { status: 200 }))
    const { onSuccess } = renderModal()

    const answers = screen.getAllByPlaceholderText(/type your answer here/i)
    await user.type(answers[0], 'Because I love film.')
    await user.type(answers[1], 'Ten years of camera work.')
    await user.type(screen.getByPlaceholderText(/share why you're the perfect fit/i), 'Available immediately.')
    await user.click(screen.getByRole('button', { name: /apply now/i }))

    expect(await screen.findByText(/application submitted!/i)).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith(
      '/api/projects/proj-1/apply',
      expect.objectContaining({ method: 'POST' }),
    )
    const body = JSON.parse(applyCalls()[0][1]!.body as string)
    expect(body.answers).toEqual(['Because I love film.', 'Ten years of camera work.'])
    expect(body.notes).toBe('Available immediately.')

    // onSuccess fires after the component's 1500ms success-pause.
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1), { timeout: 3000 })
  })

  it('surfaces the API error message on failure', async () => {
    const user = userEvent.setup()
    mockApply(new Response(JSON.stringify({ error: 'You already applied to this project' }), { status: 409 }))
    renderModal()
    const answers = screen.getAllByPlaceholderText(/type your answer here/i)
    await user.type(answers[0], 'a')
    await user.type(answers[1], 'b')
    await user.click(screen.getByRole('button', { name: /apply now/i }))

    expect(await screen.findByText(/already applied/i)).toBeInTheDocument()
  })

  it('sends only the profile links that stay ticked', async () => {
    const user = userEvent.setup()
    mockApply(new Response('{}', { status: 200 }))
    renderModal()
    await screen.findByText('vimeo.com')
    await user.click(screen.getByLabelText(/example\.com/i))
    await user.click(screen.getByRole('button', { name: /apply now/i }))
    await screen.findByText(/application submitted!/i)
    const body = JSON.parse(applyCalls()[0][1]!.body as string)
    expect(body.links).toEqual(['https://vimeo.com/1'])
  })
})
