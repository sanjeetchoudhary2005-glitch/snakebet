import { Redis } from '@upstash/redis';

let redisClient: Redis | null = null;
let lastRedisError: string | null = null;
let lastRedisCheck = 0;

const RETRY_DELAY_MS = 2000;
const CACHE_TTL_MS = 5000;

function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  if (!redisClient) {
    redisClient = new Redis({ url, token });
  }
  return redisClient;
}

export async function pingRedisWithRetry(maxAttempts = 3): Promise<{ healthy: boolean; configured: boolean; error?: string }> {
  const client = getRedisClient();
  if (!client) {
    return { healthy: true, configured: false };
  }

  const now = Date.now();
  if (now - lastRedisCheck < CACHE_TTL_MS && lastRedisError === null) {
    return { healthy: true, configured: true };
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const pong = await client.ping();
      if (pong === 'PONG' || pong === 'pong') {
        lastRedisError = null;
        lastRedisCheck = now;
        return { healthy: true, configured: true };
      }
    } catch (error) {
      lastRedisError = error instanceof Error ? error.message : String(error);
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }

  lastRedisCheck = now;
  return { healthy: false, configured: true, error: lastRedisError || 'Redis ping failed' };
}

export function resetRedisClient() {
  redisClient = null;
  lastRedisError = null;
  lastRedisCheck = 0;
}

export function getRedisOrNull() {
  return getRedisClient();
}
