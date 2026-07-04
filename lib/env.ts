import { z } from 'zod';

// Define the schema
const EnvSchema = z.object({
  // Database
  DATABASE_URL: z.string(),
  DATABASE_PROVIDER: z.enum(['sqlite', 'postgresql']).optional().default('sqlite'),

  // Session & Auth
  SESSION_SECRET: z.string().min(32).default('Snakebet-dev-session-secret-change-me-in-production'),
  AUTH_SECRET: z.string().min(32).default('Snakebet-dev-auth-secret-change-me-in-production'),
  ENCRYPTION_KEY: z.string().min(16).default('0123456789abcdef0123456789abcdef'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),

  // Redis/Upstash (optional)
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Payments
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_UPI_ID: z.string().optional().default('merchant@upi'),

  // Email (Resend)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional().default('Snakebet <noreply@yourdomain.com>'),

  // SMS OTP (optional)
  MSG91_AUTH_KEY: z.string().optional(),

  // Admin
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  ADMIN_IPS: z.string().optional(),

  // WebSocket
  WS_HOST: z.string().optional().default('127.0.0.1'),
  WS_PORT: z.string().or(z.number()).optional().default('8080'),
  WS_BROADCAST_PORT: z.string().or(z.number()).optional().default('8091'),
  WS_INTERNAL_SECRET: z.string().optional().default('dev-internal'),
  NEXT_PUBLIC_WS_URL: z.string().optional().default('ws://localhost:8080'),

  // Live activity
  LIVE_WIN_THRESHOLD: z.string().or(z.number()).optional().default(100),

  // Monitoring
  SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  HEALTH_ALERT_WEBHOOK_URL: z.string().optional(),

  // House pool
  MAX_EXPOSURE_PCT: z.string().or(z.number()).optional().default(0.10),
  MAX_GAME_EXPOSURE_PCT: z.string().or(z.number()).optional().default(0.30),

  // Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

// Parse environment variables
const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;
