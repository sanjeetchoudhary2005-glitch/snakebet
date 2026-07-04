const memoryCache = new Map<string, { value: string; expiresAt: number }>();

export async function cacheGet<T>(key: string): Promise<T | null> {
  const { getRedisOrNull } = await import('@/lib/redis');
  const redis = getRedisOrNull();

  if (redis) {
    try {
      const raw = await redis.get<string>(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      // fall through to memory
    }
  }

  const entry = memoryCache.get(key);
  if (!entry || entry.expiresAt < Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return JSON.parse(entry.value) as T;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const serialized = JSON.stringify(value);
  const { getRedisOrNull } = await import('@/lib/redis');
  const redis = getRedisOrNull();

  if (redis) {
    try {
      await redis.set(key, serialized, { ex: ttlSeconds });
      return;
    } catch {
      // fall through
    }
  }

  memoryCache.set(key, { value: serialized, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function cacheDel(key: string): Promise<void> {
  const { getRedisOrNull } = await import('@/lib/redis');
  const redis = getRedisOrNull();
  if (redis) {
    try {
      await redis.del(key);
    } catch {
      // ignore
    }
  }
  memoryCache.delete(key);
}
