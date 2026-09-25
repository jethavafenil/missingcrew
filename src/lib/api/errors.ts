import { ZodError } from 'zod'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (error instanceof ZodError) {
    return new ApiError(400, 'Invalid request', 'VALIDATION_ERROR', error.flatten())
  }
  return new ApiError(500, 'Internal server error', 'INTERNAL_ERROR')
}
