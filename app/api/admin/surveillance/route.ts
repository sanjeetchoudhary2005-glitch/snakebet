import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin';
import { getHousePool, getActiveRoundsExposure } from '@/lib/liquidity';

const EXPECTED_RTP: Record<string, number> = {
  dice: 0.98,
  mines: 0.975,
  crash: 0.97,
  plinko: 0.97,
  coinflip: 0.98,
  wheel: 0.97,
  hilo: 0.975,
  limbo: 0.98,
  keno: 0.96,
  roulette: 0.973,
  blackjack: 0.995,
  slots: 0.965,
};

type Flag = {
  userId: string;
  username?: string | null;
  email?: string | null;
  reason: string;
  severity: 'medium' | 'high';
  metric: string;
};

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const flags = new Map<string, Flag>();
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  const recentBets = await prisma.transaction.findMany({
    where: { type: 'BET', createdAt: { gte: oneMinuteAgo } },
    include: { user: { select: { username: true, email: true } } },
  });

  const betsByUser = new Map<string, typeof recentBets>();
  for (const bet of recentBets) {
    betsByUser.set(bet.userId, [...(betsByUser.get(bet.userId) || []), bet]);
  }
  for (const [userId, bets] of betsByUser) {
    if (bets.length > 20) {
      const first = bets[0];
      flags.set(`rapid:${userId}`, {
        userId,
        username: first.user.username,
        email: first.user.email,
        reason: 'Bet frequency exceeds 20 bets/minute',
        severity: 'high',
        metric: `${bets.length} bets in the last minute`,
      });
    }
  }

  const usersWithBets = await prisma.transaction.groupBy({
    by: ['userId', 'gameId'],
    where: { type: { in: ['BET', 'WIN'] }, gameId: { not: null } },
    _count: { _all: true },
  });

  for (const group of usersWithBets) {
    if (!group.gameId || group._count._all < 100) continue;
    const transactions = await prisma.transaction.findMany({
      where: { userId: group.userId, gameId: group.gameId, type: { in: ['BET', 'WIN'] } },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { user: { select: { username: true, email: true } } },
    });
    const betTotal = transactions.filter((tx) => tx.type === 'BET').reduce((sum, tx) => sum + Number(tx.amount), 0);
    const winTotal = transactions.filter((tx) => tx.type === 'WIN').reduce((sum, tx) => sum + Number(tx.amount), 0);
    if (betTotal <= 0) continue;
    const actual = winTotal / betTotal;
    const expected = EXPECTED_RTP[group.gameId] ?? 0.97;
    const variance = Math.abs(actual - expected);
    if (variance >= 0.25) {
      const first = transactions[0];
      flags.set(`rtp:${group.userId}:${group.gameId}`, {
        userId: group.userId,
        username: first.user.username,
        email: first.user.email,
        reason: `Win-rate/RTP deviation on ${group.gameId}`,
        severity: variance >= 0.5 ? 'high' : 'medium',
        metric: `Actual ${(actual * 100).toFixed(1)}% vs expected ${(expected * 100).toFixed(1)}%`,
      });
    }
  }

  const recentLogs = await prisma.securityLog.findMany({
    where: { ip: { not: null }, userId: { not: null }, createdAt: { gte: fifteenMinutesAgo } },
    select: { ip: true, userId: true },
  });
  const usersByIp = new Map<string, Set<string>>();
  for (const log of recentLogs) {
    if (!log.ip || !log.userId) continue;
    if (!usersByIp.has(log.ip)) usersByIp.set(log.ip, new Set());
    usersByIp.get(log.ip)!.add(log.userId);
  }
  for (const [ip, userIds] of usersByIp) {
    if (userIds.size < 3) continue;
    const users = await prisma.user.findMany({
      where: { id: { in: [...userIds] } },
      select: { id: true, username: true, email: true },
    });
    for (const user of users) {
      flags.set(`ip:${ip}:${user.id}`, {
        userId: user.id,
        username: user.username,
        email: user.email,
        reason: 'Multiple accounts sharing IP in short window',
        severity: 'medium',
        metric: `${userIds.size} accounts on ${ip}`,
      });
    }
  }

  const events = await prisma.securityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const pool = await getHousePool();
  const perGameExposure = {
    mines: await getActiveRoundsExposure('mines'),
    blackjack: await getActiveRoundsExposure('blackjack'),
    hilo: await getActiveRoundsExposure('hilo'),
    dragontower: await getActiveRoundsExposure('dragontower'),
  };

  return NextResponse.json({
    flags: [...flags.values()],
    stats: {
      activeFlags: flags.size,
      rapidBetUsers: [...flags.keys()].filter((key) => key.startsWith('rapid:')).length,
      sharedIpUsers: [...flags.keys()].filter((key) => key.startsWith('ip:')).length,
      recentEvents: events.length,
    },
    events,
    pool,
    perGameExposure,
  });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const body = await req.json();
    const { totalLiquidity, baselineLiquidity, platformPaused } = body;

    const data: any = {};
    if (typeof totalLiquidity === 'number') data.totalLiquidity = totalLiquidity;
    if (typeof baselineLiquidity === 'number') data.baselineLiquidity = baselineLiquidity;
    if (typeof platformPaused === 'boolean') data.platformPaused = platformPaused;

    // Retrieve or create pool row to ensure we can update it
    await getHousePool();

    const pool = await prisma.housePool.update({
      where: { id: 'global' },
      data,
    });

    return NextResponse.json({ success: true, pool });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update liquidity pool settings' }, { status: 500 });
  }
}
