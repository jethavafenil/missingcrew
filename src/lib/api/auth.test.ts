import { describe, expect, it, vi } from 'vitest'
import { requireAuth, requireRole } from '@/lib/api/auth'

vi.mock('@/lib/auth/server', () => ({ getSession: vi.fn() }))
import { getSession } from '@/lib/auth/server'
const getSessionMock = vi.mocked(getSession)

describe('requireAuth', () => {
  it('throws 401 UNAUTHORIZED without a session', async () => {
    getSessionMock.mockResolvedValueOnce(null as never)
    await expect(requireAuth()).rejects.toMatchObject({ status: 401, code: 'UNAUTHORIZED' })
  })

  it('returns session + requester derived from the session user', async () => {
    getSessionMock.mockResolvedValueOnce({
      user: { id: 'u1', role: 'EMPLOYER' },
    } as never)
    const principal = await requireAuth()
    expect(principal.requester).toEqual({ userId: 'u1', role: 'EMPLOYER' })
  })
})

describe('requireRole', () => {
  it('throws 403 FORBIDDEN when the role does not match', async () => {
    getSessionMock.mockResolvedValueOnce({
      user: { id: 'u1', role: 'CREW' },
    } as never)
    await expect(requireRole('EMPLOYER')).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' })
  })

  it('passes through when the role matches', async () => {
    getSessionMock.mockResolvedValueOnce({
      user: { id: 'u1', role: 'ADMIN' },
    } as never)
    const principal = await requireRole('ADMIN')
    expect(principal.requester.role).toBe('ADMIN')
  })
})
