import { NextResponse } from 'next/server'
import { normalizeApiError } from '@/lib/api/errors'
import { logError } from '@/lib/api/logger'

type RouteContext = { params?: Promise<Record<string, string | string[]>> }
type RouteHandler<T = unknown> = (request: Request, context: RouteContext) => Promise<T> | T

export function handle<T>(fn: RouteHandler<T>) {
  return async (request: Request, context: RouteContext = {}) => {
    try {
      const result = await fn(request, context)
      if (result instanceof Response) return result
      return NextResponse.json(result ?? { success: true })
    } catch (cause) {
      const error = normalizeApiError(cause)
      if (error.status >= 500) logError('api.request_failed', cause, { method: request.method, path: new URL(request.url).pathname })
      return NextResponse.json(
        {
          error: error.message,
          ...(error.code ? { code: error.code } : {}),
          ...(error.details !== undefined ? { details: error.details } : {}),
        },
        { status: error.status },
      )
    }
  }
}
