import { getRedisClient } from './redis'

// In-memory fallback store with TTL handling
const memoryStore = new Map<string, { code: string; expiresAt: number }>()

function makeKey(userId: string, phoneNumber: string) {
  return `otp:${userId}:${phoneNumber}`
}

export async function setOTP(userId: string, phoneNumber: string, code: string, ttlSeconds: number) {
  const key = makeKey(userId, phoneNumber)
  try {
    const redis = await getRedisClient()
    await redis.set(key, code, { EX: ttlSeconds })
    return
  } catch (err) {
    // Fallback to memory
    const expiresAt = Date.now() + ttlSeconds * 1000
    memoryStore.set(key, { code, expiresAt })
  }
}

export async function getOTP(userId: string, phoneNumber: string): Promise<string | null> {
  const key = makeKey(userId, phoneNumber)
  try {
    const redis = await getRedisClient()
    const val = await redis.get(key)
    return val
  } catch (err) {
    const entry = memoryStore.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      memoryStore.delete(key)
      return null
    }
    return entry.code
  }
}

export async function delOTP(userId: string, phoneNumber: string) {
  const key = makeKey(userId, phoneNumber)
  try {
    const redis = await getRedisClient()
    await redis.del(key)
    return
  } catch (err) {
    memoryStore.delete(key)
  }
}
