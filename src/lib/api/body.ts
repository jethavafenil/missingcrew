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
    // Surface the first rule that failed so forms can show an actionable message.
    const firstIssue = parsed.error.issues[0]?.message
    throw new ApiError(400, firstIssue || 'Invalid request', 'VALIDATION_ERROR', parsed.error.flatten())
  }
  return parsed.data
}
