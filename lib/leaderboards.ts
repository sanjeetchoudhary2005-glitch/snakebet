import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { cacheGet, cacheSet } from '@/lib/cache';
import { maskUsername } from '@/lib/privacy';

export type LeaderboardPeriod = 'today' | 'weekly' | 'alltime';

function periodStart(period: LeaderboardPeriod): Date | null {
  const now = new Date();
  if (period === 'alltime') return null;
  if (period === 'today') {
    const start = new Date(now);
    start.setUTCHours(0, 0, 0, 0);
    return start;
  }
  return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
}

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  username: string;
  gamesPlayed: number;
  netProfit: number;
  winRate: number;
};

export async function getLeaderboard(params: {
  period: LeaderboardPeriod;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;
  const cacheKey = `leaderboard:${params.period}:${page}:${limit}`;

  const cached = await cacheGet<{ entries: LeaderboardEntry[]; total: number }>(cacheKey);
  if (cached) return cached;

  const since = periodStart(params.period);

  const countRows = since
    ? await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count FROM (
          SELECT t."userId"
          FROM "Transaction" t
          WHERE t.status = 'completed'
            AND t.type IN ('BET', 'WIN')
            AND t."createdAt" >= ${since}
          GROUP BY t."userId"
          HAVING COUNT(CASE WHEN t.type = 'BET' THEN 1 END) > 0
        ) sub
      `
    : await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count FROM (
          SELECT t."userId"
          FROM "Transaction" t
          WHERE t.status = 'completed'
            AND t.type IN ('BET', 'WIN')
          GROUP BY t."userId"
          HAVING COUNT(CASE WHEN t.type = 'BET' THEN 1 END) > 0
        ) sub
      `;

  const total = Number(countRows[0]?.count || 0);

  const rows = since
    ? await prisma.$queryRaw<
        Array<{
          userId: string;
          username: string;
          netProfit: unknown;
          gamesPlayed: bigint;
          wins: bigint;
        }>
      >`
        SELECT
          t."userId",
          u.username,
          (
            COALESCE(SUM(CASE WHEN t.type = 'WIN' THEN t.amount ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN t.type = 'BET' THEN t.amount ELSE 0 END), 0)
          ) AS "netProfit",
          COUNT(CASE WHEN t.type = 'BET' THEN 1 END)::bigint AS "gamesPlayed",
          COUNT(CASE WHEN t.type = 'WIN' THEN 1 END)::bigint AS wins
        FROM "Transaction" t
        JOIN "User" u ON u.id = t."userId"
        WHERE t.status = 'completed'
          AND t.type IN ('BET', 'WIN')
          AND t."createdAt" >= ${since}
        GROUP BY t."userId", u.username
        HAVING COUNT(CASE WHEN t.type = 'BET' THEN 1 END) > 0
        ORDER BY "netProfit" DESC
        LIMIT ${limit} OFFSET ${skip}
      `
    : await prisma.$queryRaw<
        Array<{
          userId: string;
          username: string;
          netProfit: unknown;
          gamesPlayed: bigint;
          wins: bigint;
        }>
      >`
        SELECT
          t."userId",
          u.username,
          (
            COALESCE(SUM(CASE WHEN t.type = 'WIN' THEN t.amount ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN t.type = 'BET' THEN t.amount ELSE 0 END), 0)
          ) AS "netProfit",
          COUNT(CASE WHEN t.type = 'BET' THEN 1 END)::bigint AS "gamesPlayed",
          COUNT(CASE WHEN t.type = 'WIN' THEN 1 END)::bigint AS wins
        FROM "Transaction" t
        JOIN "User" u ON u.id = t."userId"
        WHERE t.status = 'completed'
          AND t.type IN ('BET', 'WIN')
        GROUP BY t."userId", u.username
        HAVING COUNT(CASE WHEN t.type = 'BET' THEN 1 END) > 0
        ORDER BY "netProfit" DESC
        LIMIT ${limit} OFFSET ${skip}
      `;

  const entries: LeaderboardEntry[] = rows.map((row, index) => {
    const gamesPlayed = Number(row.gamesPlayed);
    const wins = Number(row.wins);
    return {
      rank: skip + index + 1,
      userId: row.userId,
      username: maskUsername(row.username),
      gamesPlayed,
      netProfit: Number(row.netProfit),
      winRate: gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 1000) / 10 : 0,
    };
  });

  const result = { entries, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  await cacheSet(cacheKey, result, 45);
  return result;
}

export async function getUserLeaderboardRank(userId: string, period: LeaderboardPeriod) {
  const since = periodStart(period);
  const rows = since
    ? await prisma.$queryRaw<Array<{ userId: string; netProfit: unknown }>>`
        SELECT
          t."userId",
          (
            COALESCE(SUM(CASE WHEN t.type = 'WIN' THEN t.amount ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN t.type = 'BET' THEN t.amount ELSE 0 END), 0)
          ) AS "netProfit"
        FROM "Transaction" t
        WHERE t.status = 'completed'
          AND t.type IN ('BET', 'WIN')
          AND t."createdAt" >= ${since}
        GROUP BY t."userId"
        HAVING COUNT(CASE WHEN t.type = 'BET' THEN 1 END) > 0
        ORDER BY "netProfit" DESC
      `
    : await prisma.$queryRaw<Array<{ userId: string; netProfit: unknown }>>`
        SELECT
          t."userId",
          (
            COALESCE(SUM(CASE WHEN t.type = 'WIN' THEN t.amount ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN t.type = 'BET' THEN t.amount ELSE 0 END), 0)
          ) AS "netProfit"
        FROM "Transaction" t
        WHERE t.status = 'completed'
          AND t.type IN ('BET', 'WIN')
        GROUP BY t."userId"
        HAVING COUNT(CASE WHEN t.type = 'BET' THEN 1 END) > 0
        ORDER BY "netProfit" DESC
      `;

  const index = rows.findIndex((r) => r.userId === userId);
  if (index === -1) return null;
  return { rank: index + 1, netProfit: Number(rows[index].netProfit) };
}
