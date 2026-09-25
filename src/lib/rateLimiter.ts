import { createClient, type RedisClientType } from 'redis'
import { RateLimiterMemory, RateLimiterRedis, type IRateLimiterOptions } from 'rate-limiter-flexible'
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { env } from '@/lib/env'
import { logError } from '@/lib/api/logger'

export type RateLimitPolicy = { points: number; duration: number; blockDuration?: number }

export const RATE_LIMITS = {
  authRegister: { points: 5, duration: 900, blockDuration: 900 },
  contact: { points: 3, duration: 600, blockDuration: 600 },
  applicationApply: { points: 10, duration: 600 },
  projectPost: { points: 10, duration: 3600 },
  connectionRequest: { points: 20, duration: 3600 },
  otpSend: { points: 3, duration: 900, blockDuration: 1800 },
  otpVerify: { points: 5, duration: 600, blockDuration: 1800 },
  default: { points: 10, duration: 60 },
} satisfies Record<string, RateLimitPolicy>

const state = globalThis as unknown as {
  rateLimitRedis?: RedisClientType
  rateLimitRedisConnecting?: Promise<unknown>
  rateLimitRedisCooldown?: boolean
  rateLimiters?: Map<string, RateLimiterMemory | RateLimiterRedis>
}

function clientIp(request: NextRequest): string {
  return request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')?.trim()
    || 'unknown'
}

// Redis is optional (local dev often runs without it). A failed connect must
// drop the client entirely: a redis client stuck in its reconnect loop accepts
// queued commands that never complete, so RateLimiterRedis.consume() would
// await forever and every rate-limited request would hang. After a failure we
// fall back to the in-process memory limiter and retry Redis after a cooldown.
const REDIS_RETRY_COOLDOWN_MS = 60_000

function getRedis(): RedisClientType | undefined {
  if (!env.REDIS_URL || state.rateLimitRedisCooldown) return undefined
  if (!state.rateLimitRedis) {
    const client = createClient({
      url: env.REDIS_URL,
      socket: {
        // Cap reconnects so commands error (and hit the insurance limiter)
        // instead of queueing forever if Redis dies mid-run.
        reconnectStrategy: (retries: number) => (retries > 5 ? false : Math.min(retries * 100, 1_000)),
      },
    })
    client.on('error', (error) => logError('rate_limit.redis_error', error))
    state.rateLimitRedis = client as RedisClientType
    state.rateLimitRedisConnecting = client.connect().catch((error) => {
      logError('rate_limit.redis_connect_failed', error)
      state.rateLimitRedis = undefined
      state.rateLimitRedisCooldown = true
      setTimeout(() => { state.rateLimitRedisCooldown = false }, REDIS_RETRY_COOLDOWN_MS)
      try { client.disconnect() } catch { /* already closed */ }
    })
  }
  return state.rateLimitRedis
}

function getLimiter(endpoint: string, policy: RateLimitPolicy) {
  state.rateLimiters ??= new Map()
  const cacheKey = `${endpoint}:${policy.points}:${policy.duration}:${policy.blockDuration ?? 0}`
  const cached = state.rateLimiters.get(cacheKey)
  if (cached) return cached
  const options: IRateLimiterOptions = { keyPrefix: `missingcrew:${endpoint}`, ...policy }
  const redis = getRedis()
  const created = redis
    ? new RateLimiterRedis({ ...options, storeClient: redis, insuranceLimiter: new RateLimiterMemory(options) })
    : new RateLimiterMemory(options)
  state.rateLimiters.set(cacheKey, created)
  return created
}

// Rate limiting is disabled outside production for now: local dev runs
// without Redis and the fallback caused more trouble than value. It turns
// back on automatically for production builds (NODE_ENV=production) or by
// setting RATE_LIMIT_ENABLED=true.
function rateLimitingEnabled(): boolean {
  if (process.env.RATE_LIMIT_ENABLED === 'true') return true
  return process.env.NODE_ENV === 'production'
}

// Rate limiting middleware for auth endpoints
export async function rateLimitMiddleware(
  request: NextRequest,
  endpoint: string,
  options: { userId?: string; policy?: RateLimitPolicy } = {},
): Promise<NextResponse | null> {
  if (!rateLimitingEnabled()) return null
  const policy = options.policy ?? RATE_LIMITS.default
  try {
    if (state.rateLimitRedisConnecting) await state.rateLimitRedisConnecting
    await getLimiter(endpoint, policy).consume(`${options.userId ?? 'anonymous'}:${clientIp(request)}`)
    return null
  } catch (result: unknown) {
    const retryMs = typeof result === 'object' && result && 'msBeforeNext' in result
      ? Number((result as { msBeforeNext: number }).msBeforeNext)
      : policy.duration * 1000
    return NextResponse.json(
      { success: false, message: 'Too many requests, please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.max(1, Math.ceil(retryMs / 1000))),
          'X-RateLimit-Limit': String(policy.points),
          'X-RateLimit-Remaining': '0',
        },
      },
    )
  }
}
