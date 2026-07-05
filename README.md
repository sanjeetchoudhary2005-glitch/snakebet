# Snakebet Operations

## Local Setup

```bash
npm install
# Set up MySQL database and update DATABASE_URL in .env
npx prisma db push
npx prisma db seed
npm run dev
# separate terminal:
npm run websocket
```

The app uses **MySQL** in all environments.

## Required Environment

Copy `.env.example` and set real values. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for production topology.

## Admin Seed

```bash
npx prisma db seed
```

Creates admin (`ADMIN_EMAIL` or `admin@Snakebet.local`) and a funded test user.

## Production

```bash
npm install
npm run migrate:prod
npm run build
npm run start
# plus WebSocket service — see docs/DEPLOYMENT.md
```

## Health Check

```bash
curl http://localhost:3000/api/health
```

Returns database, Redis, and WebSocket status.

## Backups (MySQL)

Use `mysqldump` to backup your MySQL database.

## Phase 1 QA

See [QA_PHASE1.md](QA_PHASE1.md) and run:

```bash
npm run test:wallet
npm run test:phase1-games
```
