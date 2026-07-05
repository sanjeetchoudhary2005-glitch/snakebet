import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

export type ActiveSelfExclusion = {
  id: string;
  until: Date | null;
  createdAt: Date;
};

export function formatSelfExclusionMessage(exclusion: ActiveSelfExclusion) {
  if (!exclusion.until) {
    return 'Your account is permanently self-excluded from gameplay.';
  }

  return `Your account is self-excluded until ${exclusion.until.toISOString()}.`;
}

export async function getActiveSelfExclusion(userId: string): Promise<ActiveSelfExclusion | null> {
  const now = new Date();
  return prisma.selfExclusion.findFirst({
    where: {
      userId,
      OR: [
        { until: null },
        { until: { gt: now } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true, until: true, createdAt: true },
  });
}

export async function assertCanPlay(userId: string) {
  const exclusion = await getActiveSelfExclusion(userId);
  if (!exclusion) return;

  const error = new Error(formatSelfExclusionMessage(exclusion));
  error.name = 'SelfExclusionError';
  throw error;
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function assertWithinDailyDepositLimit(userId: string, amount: number | Prisma.Decimal) {
  const settings = await prisma.responsibleGamingSettings.findUnique({
    where: { userId },
    select: { depositLimit: true },
  });

  if (!settings?.depositLimit) return;

  const requested = amount instanceof Prisma.Decimal ? amount : new Prisma.Decimal(amount);
  const depositedToday = await prisma.transaction.aggregate({
    where: {
      userId,
      type: 'DEPOSIT',
      status: { in: ['PENDING', 'COMPLETED', 'completed'] },
      createdAt: { gte: startOfToday() },
    },
    _sum: { amount: true },
  });

  const usedToday = depositedToday._sum.amount ?? new Prisma.Decimal(0);
  if (usedToday.plus(requested).greaterThan(settings.depositLimit)) {
    throw new Error('Daily deposit limit exceeded');
  }
}

export function selfExclusionUntil(period: '24h' | '7d' | '30d' | 'permanent') {
  if (period === 'permanent') return null;

  const durations: Record<'24h' | '7d' | '30d', number> = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  };

  return new Date(Date.now() + durations[period]);
}
