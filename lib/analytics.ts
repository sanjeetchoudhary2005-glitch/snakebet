import { prisma } from '@/lib/prisma';

export type AnalyticsRange = '7d' | '30d' | '90d' | 'all';

function rangeStart(range: AnalyticsRange): Date | null {
  if (range === 'all') return null;
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export async function getUserAnalytics(userId: string, range: AnalyticsRange = '30d') {
  const since = rangeStart(range);
  const whereBase = {
    userId,
    status: 'completed' as const,
    ...(since ? { createdAt: { gte: since } } : {}),
  };

  const [betAgg, winAgg, betCount, winCount] = await Promise.all([
    prisma.transaction.aggregate({
      where: { ...whereBase, type: 'BET' },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...whereBase, type: 'WIN' },
      _sum: { amount: true },
    }),
    prisma.transaction.count({ where: { ...whereBase, type: 'BET' } }),
    prisma.transaction.count({ where: { ...whereBase, type: 'WIN', amount: { gt: 0 } } }),
  ]);

  const totalWagered = Number(betAgg._sum.amount || 0);
  const totalWon = Number(winAgg._sum.amount || 0);
  const netProfit = totalWon - totalWagered;
  const gamesPlayed = betCount;
  const winRate = gamesPlayed > 0 ? Math.round((winCount / gamesPlayed) * 1000) / 10 : 0;

  const gameBreakdown = since
    ? await prisma.$queryRaw<
        Array<{ gameId: string; wagered: unknown; won: unknown; bets: bigint; wins: bigint }>
      >`
        SELECT
          COALESCE(t."gameId", 'unknown') AS "gameId",
          COALESCE(SUM(CASE WHEN t.type = 'BET' THEN t.amount ELSE 0 END), 0) AS wagered,
          COALESCE(SUM(CASE WHEN t.type = 'WIN' THEN t.amount ELSE 0 END), 0) AS won,
          COUNT(CASE WHEN t.type = 'BET' THEN 1 END)::bigint AS bets,
          COUNT(CASE WHEN t.type = 'WIN' AND t.amount > 0 THEN 1 END)::bigint AS wins
        FROM "Transaction" t
        WHERE t."userId" = ${userId}
          AND t.status = 'completed'
          AND t.type IN ('BET', 'WIN')
          AND t."createdAt" >= ${since}
        GROUP BY COALESCE(t."gameId", 'unknown')
        HAVING COUNT(CASE WHEN t.type = 'BET' THEN 1 END) > 0
        ORDER BY wagered DESC
      `
    : await prisma.$queryRaw<
        Array<{ gameId: string; wagered: unknown; won: unknown; bets: bigint; wins: bigint }>
      >`
        SELECT
          COALESCE(t."gameId", 'unknown') AS "gameId",
          COALESCE(SUM(CASE WHEN t.type = 'BET' THEN t.amount ELSE 0 END), 0) AS wagered,
          COALESCE(SUM(CASE WHEN t.type = 'WIN' THEN t.amount ELSE 0 END), 0) AS won,
          COUNT(CASE WHEN t.type = 'BET' THEN 1 END)::bigint AS bets,
          COUNT(CASE WHEN t.type = 'WIN' AND t.amount > 0 THEN 1 END)::bigint AS wins
        FROM "Transaction" t
        WHERE t."userId" = ${userId}
          AND t.status = 'completed'
          AND t.type IN ('BET', 'WIN')
        GROUP BY COALESCE(t."gameId", 'unknown')
        HAVING COUNT(CASE WHEN t.type = 'BET' THEN 1 END) > 0
        ORDER BY wagered DESC
      `;

  const dailySince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const dailyRows = await prisma.$queryRaw<
    Array<{ day: Date; wagered: unknown; won: unknown }>
  >`
    SELECT
      DATE_TRUNC('day', t."createdAt") AS day,
      COALESCE(SUM(CASE WHEN t.type = 'BET' THEN t.amount ELSE 0 END), 0) AS wagered,
      COALESCE(SUM(CASE WHEN t.type = 'WIN' THEN t.amount ELSE 0 END), 0) AS won
    FROM "Transaction" t
    WHERE t."userId" = ${userId}
      AND t.status = 'completed'
      AND t.type IN ('BET', 'WIN')
      AND t."createdAt" >= ${dailySince}
    GROUP BY DATE_TRUNC('day', t."createdAt")
    ORDER BY day ASC
  `;

  return {
    range,
    summary: {
      totalWagered,
      totalWon,
      netProfit,
      gamesPlayed,
      winRate,
    },
    byGame: gameBreakdown.map((row) => {
      const wagered = Number(row.wagered);
      const won = Number(row.won);
      const bets = Number(row.bets);
      const wins = Number(row.wins);
      return {
        gameId: row.gameId,
        wagered,
        won,
        net: won - wagered,
        bets,
        winRate: bets > 0 ? Math.round((wins / bets) * 1000) / 10 : 0,
      };
    }),
    daily: dailyRows.map((row) => ({
      date: row.day.toISOString().slice(0, 10),
      wagered: Number(row.wagered),
      won: Number(row.won),
      net: Number(row.won) - Number(row.wagered),
    })),
  };
}
