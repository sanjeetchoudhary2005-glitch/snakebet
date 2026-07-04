#!/usr/bin/env npx tsx
/**
 * Phase 2 query performance check — run against PostgreSQL with real data.
 * Usage: DATABASE_URL=postgresql://... npx tsx scripts/phase2-explain-analyze.ts
 */
import { prisma } from '../lib/prisma';

async function explain(label: string, sql: string) {
  console.log(`\n=== ${label} ===`);
  const rows = await prisma.$queryRawUnsafe<Array<{ 'QUERY PLAN': string }>>(
    `EXPLAIN ANALYZE ${sql}`
  );
  for (const row of rows) {
    console.log(row['QUERY PLAN']);
  }
}

async function main() {
  const userId = (
    await prisma.user.findFirst({ select: { id: true } })
  )?.id;

  if (!userId) {
    console.log('No users in DB — seed data first, then re-run.');
    return;
  }

  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const sinceDay = new Date();
  sinceDay.setUTCHours(0, 0, 0, 0);

  await explain('Leaderboard (weekly net profit)', `
    SELECT t."userId", SUM(CASE WHEN t.type = 'WIN' THEN t.amount ELSE 0 END)
         - SUM(CASE WHEN t.type = 'BET' THEN t.amount ELSE 0 END) AS net
    FROM "Transaction" t
    WHERE t.status = 'completed'
      AND t.type IN ('BET', 'WIN')
      AND t."createdAt" >= '${since7d.toISOString()}'
    GROUP BY t."userId"
    ORDER BY net DESC
    LIMIT 20
  `);

  await explain('Analytics (user bet/win aggregate)', `
    SELECT type, SUM(amount)
    FROM "Transaction"
    WHERE "userId" = '${userId}'
      AND status = 'completed'
      AND type IN ('BET', 'WIN')
      AND "createdAt" >= '${since7d.toISOString()}'
    GROUP BY type
  `);

  await explain('Recent wins (live ticker)', `
    SELECT id FROM "Transaction"
    WHERE type = 'WIN' AND status = 'completed' AND amount >= 100
    ORDER BY "createdAt" DESC
    LIMIT 20
  `);

  await explain('Online users (lastActiveAt)', `
    SELECT COUNT(*) FROM "User"
    WHERE "lastActiveAt" >= '${new Date(Date.now() - 5 * 60 * 1000).toISOString()}'
  `);

  console.log('\nDone. Look for Index Scan / Bitmap Index Scan — avoid Seq Scan on Transaction at scale.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
