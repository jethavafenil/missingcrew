import { describe, expect, it } from 'vitest'
import { assertUser, assertAdmin, requesterFromSession, SYSTEM_REQUESTER } from '@/lib/repo/scope'

describe('assertUser', () => {
  it('requires a userId', () => {
    expect(() => assertUser(undefined)).toThrowError(/Authentication required/)
    expect(() => assertUser({ userId: '', role: 'CREW' })).toThrowError(/Authentication required/)
  })

  it('returns the requester when authenticated', () => {
    const req = { userId: 'u1', role: 'CREW' as const }
    expect(assertUser(req).userId).toBe('u1')
  })
})

describe('assertAdmin', () => {
  it('rejects non-admin roles', () => {
    expect(() => assertAdmin({ userId: 'u1', role: 'CREW' })).toThrowError(/Admin permissions required/)
    expect(() => assertAdmin({ userId: 'u1', role: 'EMPLOYER' })).toThrowError(/Admin permissions required/)
    expect(() => assertAdmin(undefined)).toThrowError(/Admin permissions required/)
  })

  it('accepts ADMIN', () => {
    const req = { userId: 'a1', role: 'ADMIN' as const }
    expect(assertAdmin(req).role).toBe('ADMIN')
  })
})

describe('requesterFromSession', () => {
  it('maps session roles to requester roles', () => {
    expect(requesterFromSession({ user: { id: 'u1', role: 'EMPLOYER' } }).role).toBe('EMPLOYER')
    expect(requesterFromSession({ user: { id: 'u2', role: 'ADMIN' } }).role).toBe('ADMIN')
  })

  it('falls back to CREW for unknown/missing roles', () => {
    expect(requesterFromSession({ user: { id: 'u3', role: null } }).role).toBe('CREW')
    expect(requesterFromSession({ user: { id: 'u4', role: 'SOMETHING' } }).role).toBe('CREW')
    expect(requesterFromSession({ user: { id: 'u5' } }).role).toBe('CREW')
  })

  it('throws without a user id', () => {
    expect(() => requesterFromSession(null)).toThrowError(/Authentication required/)
    expect(() => requesterFromSession({ user: { id: null, role: null } })).toThrowError(/Authentication required/)
  })
})

describe('SYSTEM_REQUESTER', () => {
  it('is a service-role admin requester', () => {
    expect(SYSTEM_REQUESTER.role).toBe('ADMIN')
  })
})
