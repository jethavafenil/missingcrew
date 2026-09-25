import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { parseBody } from '@/lib/api/body'
import { ApiError, normalizeApiError } from '@/lib/api/errors'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
})

describe('parseBody', () => {
  it('parses a valid body', async () => {
    const req = new Request('http://localhost/api/x', {
      method: 'POST',
      body: JSON.stringify({ name: 'Ada', email: 'ada@example.com' }),
    })
    await expect(parseBody(req, schema)).resolves.toEqual({ name: 'Ada', email: 'ada@example.com' })
  })

  it('rejects invalid JSON with a 400 INVALID_JSON ApiError', async () => {
    const req = new Request('http://localhost/api/x', { method: 'POST', body: '{nope' })
    await expect(parseBody(req, schema)).rejects.toMatchObject({
      status: 400,
      code: 'INVALID_JSON',
    })
  })

  it('rejects schema violations with a 400 VALIDATION_ERROR ApiError and flattened details', async () => {
    const makeReq = () =>
      new Request('http://localhost/api/x', {
        method: 'POST',
        body: JSON.stringify({ name: 'A', email: 'not-an-email' }),
      })
    try {
      await parseBody(makeReq(), schema)
      expect.unreachable('parseBody should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError)
      expect((e as ApiError).status).toBe(400)
      expect((e as ApiError).code).toBe('VALIDATION_ERROR')
      expect((e as ApiError).details).toBeDefined()
    }
  })
})

describe('normalizeApiError', () => {
  it('passes ApiError through untouched', () => {
    const err = new ApiError(403, 'Forbidden', 'FORBIDDEN')
    expect(normalizeApiError(err)).toBe(err)
  })

  it('wraps ZodError as 400 VALIDATION_ERROR', () => {
    const zodErr = schema.safeParse({}).error!
    const normalized = normalizeApiError(zodErr)
    expect(normalized.status).toBe(400)
    expect(normalized.code).toBe('VALIDATION_ERROR')
    expect(normalized.details).toBeDefined()
  })

  it('wraps unknown errors as 500 INTERNAL_ERROR', () => {
    const normalized = normalizeApiError(new Error('boom'))
    expect(normalized.status).toBe(500)
    expect(normalized.code).toBe('INTERNAL_ERROR')
    expect(normalized.message).not.toContain('boom') // no internal leak
  })
})

describe('ApiError', () => {
  it('carries status, code and details', () => {
    const err = new ApiError(400, 'Invalid request', 'VALIDATION_ERROR', { a: 1 })
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe('ApiError')
    expect(err.status).toBe(400)
    expect(err.code).toBe('VALIDATION_ERROR')
    expect(err.details).toEqual({ a: 1 })
  })
})
