import type { ZodType } from 'zod'
import { ApiError } from '@/lib/api/errors'

export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    throw new ApiError(400, 'Request body must be valid JSON', 'INVALID_JSON')
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid request', 'VALIDATION_ERROR', parsed.error.flatten())
  }
  return parsed.data
}
