import { env } from '@/lib/env'
import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  if (!env.REDIS_URL) {
    throw new Error('Redis URL not configured');
  }

  if (!redisClient) {
    redisClient = createClient({ url: env.REDIS_URL });

    redisClient.on('error', (err) => {
      console.error('Redis error:', err);
    });

    try {
      await redisClient.connect();
    } catch (err) {
      try {
        await redisClient.quit();
      } catch {}
      redisClient = null;
      throw err;
    }
  }

  return redisClient;
}

export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
