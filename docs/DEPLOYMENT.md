# Deployment

## Architecture

Snakebet requires **two long-lived processes** in production:

1. **Next.js app** (`npm run build && npm run start` or `Dockerfile`)
2. **WebSocket server** (`npm run websocket` or `Dockerfile.websocket`)

Serverless platforms (e.g. Vercel) can host the Next.js app but **cannot** host the WebSocket process. Deploy `Dockerfile.websocket` to Fly.io, Railway, Render, ECS, or similar.

## Environment

See `.env.example` for all variables. Minimum production set:

- `DATABASE_URL` (MySQL)
- `SESSION_SECRET` / `AUTH_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `ENCRYPTION_KEY`
- `RESEND_API_KEY` + `EMAIL_FROM`
- `RAZORPAY_*` (live keys for production)
- `WS_HOST` / `WS_PORT` (point app health checks at WS service)
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (recommended)

## OAuth redirect URIs

| Provider | Local | Production |
| --- | --- | --- |
| Google | `http://localhost:3000/api/auth/callback/google` | `https://YOUR_DOMAIN/api/auth/callback/google` |
| Facebook | `http://localhost:3000/api/auth/callback/facebook` | `https://YOUR_DOMAIN/api/auth/callback/facebook` |

## MySQL backups

- **Managed hosts**: enable automated daily backups in the provider console (recommended retention: 7–30 days).
- **Manual**: Use `mysqldump` to backup your MySQL database.

## Health & alerts

- `GET /api/health` — returns per-dependency status (database, Redis, WebSocket).
- Set `HEALTH_ALERT_WEBHOOK_URL` to a Slack/Discord incoming webhook for failure notifications.
- Set `SENTRY_DSN` for error tracking.

## CI

GitHub Actions workflow `.github/workflows/ci.yml` runs lint, typecheck, build, migrate, and wallet smoke test on every push.
