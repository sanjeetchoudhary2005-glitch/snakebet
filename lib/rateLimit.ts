import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

type LimitResult = { success: boolean; limit: number; remaining: number; reset: number };
type LimiterLike = { limit: (identifier: string) => Promise<LimitResult> };

const hasUpstashConfig = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const redis = hasUpstashConfig
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

function createLimiter(limit: number, windowSeconds: number, prefix: string): LimiterLike {
  if (redis) {
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      analytics: true,
      prefix,
    });
  }

  return {
    limit: (identifier: string) => fallbackRateLimit(`${prefix}:${identifier}`, limit, windowSeconds),
  };
}

// Fallback to in-memory limiter if Upstash not configured
const inMemoryRateLimits = new Map<string, { count: number; resetTime: number }>();

export async function fallbackRateLimit(
  identifier: string,
  limit: number = 60,
  windowSeconds: number = 60
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  let entry = inMemoryRateLimits.get(identifier);

  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + windowMs };
  }

  entry.count += 1;
  inMemoryRateLimits.set(identifier, entry);

  const remaining = Math.max(0, limit - entry.count);
  const reset = entry.resetTime;

  return {
    success: entry.count <= limit,
    limit,
    remaining,
    reset,
  };
}

export const generalLimiter = createLimiter(60, 60, 'Snakebet:ratelimit');
export const authLimiter = createLimiter(10, 60, 'Snakebet:ratelimit:auth');
export const apiLimiter = createLimiter(100, 60, 'Snakebet:ratelimit:api');

type RateLimitConfig = {
  key: string;
  limit: number;
  windowSeconds: number;
};

export async function enforceRateLimit({ key, limit, windowSeconds }: RateLimitConfig) {
  const rate = await fallbackRateLimit(key, limit, windowSeconds);
  if (rate.success) return null;

  const retryAfter = Math.max(1, Math.ceil((rate.reset - Date.now()) / 1000));
  return NextResponse.json(
    { error: `Too many requests. Try again in ${retryAfter} seconds.` },
    { status: 429, headers: { 'Retry-After': retryAfter.toString() } }
  );
}

export async function enforceBetRateLimit(userId: string, action: string) {
  return enforceRateLimit({
    key: `bet:${userId}:${action}`,
    limit: 1,
    windowSeconds: 1,
  });
}

export async function enforceAuthRateLimit(req: Request, email: string, action: string) {
  const forwardedFor = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwardedFor || req.headers.get('x-real-ip') || 'unknown';
  return enforceRateLimit({
    key: `auth:${action}:${ip}:${email.toLowerCase()}`,
    limit: 5,
    windowSeconds: 10 * 60,
  });
}
