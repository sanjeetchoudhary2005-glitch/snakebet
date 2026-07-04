# Snakebet Phase 1 QA Checklist

Generated as part of Phase 1 foundation work. Re-run:

```bash
npm run test:wallet
npm run test:phase1-games
tsx scripts/test-razorpay-webhook-idempotency.ts
npm run build
npm run typecheck
curl -s http://localhost:3000/api/health | jq
```

## Build & infra

| Check | Status |
| --- | --- |
| `next build` zero errors | Run locally to confirm |
| `tsc --noEmit` zero errors | Run locally to confirm |
| PostgreSQL migrations apply | `npx prisma migrate deploy` |
| Docker Compose stack | `docker compose up --build` |
| CI workflow | `.github/workflows/ci.yml` |

## Auth & payments

| Check | Status |
| --- | --- |
| Signup OTP email (Resend) | Configure `RESEND_API_KEY` + send test signup |
| Google OAuth | Configure `AUTH_GOOGLE_*`, test `/api/auth/signin/google` |
| Facebook OAuth | Configure `AUTH_FACEBOOK_*` |
| Password reset E2E | Request reset → email → `/login?reset=TOKEN` |
| Razorpay webhook idempotency | `tsx scripts/test-razorpay-webhook-idempotency.ts` |
| Wallet concurrency | `npm run test:wallet` |

## Casino games — wallet debit/credit (17 games)

Run `npm run test:phase1-games` against Postgres. Expected: all **PASS**.

| # | Game | Wallet QA | Notes |
| --- | --- | --- | --- |
| 1 | Ludo | Pending run | Multiplayer WS — wallet path smoke only |
| 2 | Mines | Pending run | Multi-step — wallet path smoke only |
| 3 | Crash | Pending run | WS + cashout — wallet path smoke only |
| 4 | Plinko | Pending run | |
| 5 | Dice | Pending run | |
| 6 | Coin Flip | Pending run | |
| 7 | Wheel | Pending run | |
| 8 | HiLo | Pending run | Multi-step |
| 9 | Keno | Pending run | |
| 10 | Dragon Tower | Pending run | Multi-step |
| 11 | Roulette | Pending run | |
| 12 | Blackjack | Pending run | Multi-step |
| 13 | Slots | Pending run | |
| 14 | Andar Bahar | Pending run | |
| 15 | Baccarat | Pending run | |
| 16 | Teen Patti | Pending run | |
| 17 | Dragon Tiger | Pending run | |

## Monitoring

| Check | Status |
| --- | --- |
| `/api/health` reports DB/Redis/WS | Configure env and verify |
| Sentry DSN configured | Optional `SENTRY_DSN` |
| Postgres backups documented | `npm run backup:db` (requires `pg_dump`) |
| Health alert webhook | Optional `HEALTH_ALERT_WEBHOOK_URL` |

## Out of scope (Phase 2+)

Sports, live casino, tournaments, and chat were intentionally not modified in Phase 1.
