
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Initialize Redis (fallback to in-memory for local dev without Upstash keys)
let redis: Redis | undefined;
let otpSendLimiter: Ratelimit | undefined;
let otpVerifyLimiter: Ratelimit | undefined;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    // Rate limit for sending OTP: 5 per hour per identifier (email/phone)
    otpSendLimiter = new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(5, '1 h'),
      prefix: 'otp:send',
    });

    // Rate limit for verifying OTP: 5 attempts, then 15-min lockout
    otpVerifyLimiter = new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      prefix: 'otp:verify',
    });
  }
} catch (err) {
  console.warn('Failed to initialize Redis, rate limiting disabled:', err);
}

export async function checkOTPSendRateLimit(identifier: string): Promise<{
  allowed: boolean;
  resetTime?: number;
}> {
  if (!otpSendLimiter) {
    return { allowed: true };
  }

  const result = await otpSendLimiter.limit(identifier);
  return {
    allowed: result.success,
    resetTime: result.reset,
  };
}

export async function checkOTPVerifyRateLimit(identifier: string): Promise<{
  allowed: boolean;
  resetTime?: number;
}> {
  if (!otpVerifyLimiter) {
    return { allowed: true };
  }

  const result = await otpVerifyLimiter.limit(identifier);
  return {
    allowed: result.success,
    resetTime: result.reset,
  };
}
