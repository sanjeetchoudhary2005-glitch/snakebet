# SQLite → PostgreSQL Migration

Snakebet now uses **PostgreSQL** as the primary database. Previous SQLite migrations were replaced with a fresh PostgreSQL baseline migration:

`prisma/migrations/20260630000000_init_postgresql/migration.sql`

## Fresh install (recommended)

If you do not need to preserve local SQLite demo data:

```bash
export DATABASE_URL="postgresql://Snakebet:Snakebet@localhost:5432/Snakebet"
npx prisma migrate deploy
npx prisma db seed
```

With Docker:

```bash
docker compose up -d postgres
export DATABASE_URL="postgresql://Snakebet:Snakebet@localhost:5432/Snakebet"
npx prisma migrate deploy
npx prisma db seed
```

## Preserving SQLite data (optional)

SQLite and PostgreSQL types differ enough that a fully automated migration is not provided. For production cutover:

1. Export users, transactions, and game round tables from `prisma/dev.db` using a one-off script or tool like [pgloader](https://pgloader.io/).
2. Map `Decimal` fields as numeric strings and `BigInt` nonce fields as bigint/text.
3. Run `prisma migrate deploy` against an empty Postgres database first to create schema.
4. Import CSV/SQL dumps in dependency order: `User` → `Transaction` → game round tables.
5. Verify counts and spot-check balances before switching `DATABASE_URL`.

For most dev environments, **a fresh Postgres seed is sufficient**.

## Schema notes (SQLite → Postgres)

- Enum-like fields remain `String` columns (no Prisma enum migration required).
- JSON payloads remain stored as `String` columns (SQLite-compatible pattern retained).
- IDs use `cuid()` — no autoincrement integer migration needed.
- `BigInt` fields (`nonce`) map directly to PostgreSQL `BIGINT`.
- OAuth tables (`Account`, `Session`, `VerificationToken`) and Phase 1 auth tables are included in the Postgres baseline.

## Backups

Use managed Postgres backups in production (RDS, Supabase, Neon, etc.). For manual dumps:

```bash
npm run backup:db
```

Requires `pg_dump` on PATH and `DATABASE_URL` pointing at Postgres.
