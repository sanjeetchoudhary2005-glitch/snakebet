import { prisma } from '@/lib/prisma';
import { maskUsername, formatGameName } from '@/lib/privacy';

export const LIVE_WIN_THRESHOLD = Number(process.env.LIVE_WIN_THRESHOLD || 100);
export const ONLINE_WINDOW_MINUTES = 5;

export type ActivityEvent = {
  id: string;
  username: string;
  maskedUsername: string;
  gameId: string;
  gameName: string;
  amount: number;
  eventType: 'bet' | 'win';
  timestamp: string;
};

export async function getRecentWins(limit = 20, threshold = LIVE_WIN_THRESHOLD) {
  const wins = await prisma.transaction.findMany({
    where: {
      type: 'WIN',
      status: 'completed',
      amount: { gte: threshold },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: { select: { username: true } },
    },
  });

  return wins.map((win) => ({
    id: win.id,
    username: maskUsername(win.user.username),
    amount: Number(win.amount),
    gameId: win.gameId || 'casino',
    gameName: formatGameName(win.gameId),
    timestamp: win.createdAt.toISOString(),
    timeAgo: win.createdAt,
  }));
}

export async function getRecentWinsByGame(gameId: string, limit = 5, threshold = 0) {
  const wins = await prisma.transaction.findMany({
    where: {
      type: 'WIN',
      status: 'completed',
      gameId,
      amount: { gte: threshold },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: { select: { username: true } },
    },
  });

  return wins.map((win) => ({
    user: maskUsername(win.user.username),
    amount: Number(win.amount),
    time: win.createdAt.toISOString(),
  }));
}

export async function getTopWinnersToday(limit = 5) {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const rows = await prisma.$queryRaw<
    Array<{ userId: string; username: string; totalWon: unknown }>
  >`
    SELECT t."userId", u.username, SUM(t.amount) AS "totalWon"
    FROM "Transaction" t
    JOIN "User" u ON u.id = t."userId"
    WHERE t.type = 'WIN'
      AND t.status = 'completed'
      AND t."createdAt" >= ${startOfDay}
    GROUP BY t."userId", u.username
    ORDER BY "totalWon" DESC
    LIMIT ${limit}
  `;

  return rows.map((row, index) => ({
    rank: index + 1,
    username: maskUsername(row.username),
    amount: Number(row.totalWon),
    avatar: row.username.slice(0, 2).toUpperCase(),
  }));
}

export async function getOnlineUserCount(windowMinutes = ONLINE_WINDOW_MINUTES) {
  try {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000);
    return await prisma.user.count({
      where: { lastActiveAt: { gte: since } },
    });
  } catch {
    return 0;
  }
}

export async function touchUserActive(userId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { lastActiveAt: new Date() },
    });
  } catch {
    // Ignore errors
  }
}

export async function broadcastActivityEvent(event: Omit<ActivityEvent, 'id' | 'maskedUsername' | 'gameName' | 'timestamp'> & { id?: string; timestamp?: string }) {
  const payload: ActivityEvent = {
    id: event.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    username: event.username,
    maskedUsername: maskUsername(event.username),
    gameId: event.gameId,
    gameName: formatGameName(event.gameId),
    amount: event.amount,
    eventType: event.eventType,
    timestamp: event.timestamp || new Date().toISOString(),
  };

  const host = process.env.WS_HOST || '127.0.0.1';
  const port = process.env.WS_BROADCAST_PORT || '8091';
  const secret = process.env.WS_INTERNAL_SECRET || 'dev-internal';

  try {
    await fetch(`http://${host}:${port}/broadcast/activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(2000),
    });
  } catch (error) {
    console.warn('Activity broadcast failed (WS may be offline):', error);
  }

  return payload;
}

export async function getLiveSnapshot() {
  const [recentWins, topToday, onlineUsers] = await Promise.allSettled([
    getRecentWins(20),
    getTopWinnersToday(5),
    getOnlineUserCount(),
  ]);

  return {
    recentWins: recentWins.status === 'fulfilled' ? recentWins.value : [],
    topToday: topToday.status === 'fulfilled' ? topToday.value : [],
    onlineUsers: onlineUsers.status === 'fulfilled' ? onlineUsers.value : 0,
  };
}
