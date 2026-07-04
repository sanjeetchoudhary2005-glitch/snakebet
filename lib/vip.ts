import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type VipTierDefinition = {
  tier: number;
  name: string;
  minWagered: number;
  cashbackRate: number;
  withdrawalPriority: boolean;
  bonusMultiplier: number;
  benefits: string[];
};

export const VIP_TIERS: VipTierDefinition[] = [
  {
    tier: 0,
    name: 'Bronze',
    minWagered: 0,
    cashbackRate: 0.05,
    withdrawalPriority: false,
    bonusMultiplier: 1,
    benefits: ['5% weekly loss cashback', 'Daily bonus access', 'Standard support'],
  },
  {
    tier: 1,
    name: 'Silver',
    minWagered: 25_000,
    cashbackRate: 0.07,
    withdrawalPriority: true,
    bonusMultiplier: 1.05,
    benefits: ['7% weekly loss cashback', 'Faster withdrawals', 'Weekly bonus boosts'],
  },
  {
    tier: 2,
    name: 'Gold',
    minWagered: 100_000,
    cashbackRate: 0.1,
    withdrawalPriority: true,
    bonusMultiplier: 1.1,
    benefits: ['10% weekly loss cashback', 'Priority support', 'Higher table limits'],
  },
  {
    tier: 3,
    name: 'Platinum',
    minWagered: 250_000,
    cashbackRate: 0.12,
    withdrawalPriority: true,
    bonusMultiplier: 1.15,
    benefits: ['12% weekly loss cashback', 'Dedicated support', 'Exclusive promotions'],
  },
  {
    tier: 4,
    name: 'Diamond',
    minWagered: 500_000,
    cashbackRate: 0.15,
    withdrawalPriority: true,
    bonusMultiplier: 1.2,
    benefits: ['15% weekly loss cashback', 'VIP host', 'Highest limits & perks'],
  },
];

export function getTierForWagered(wagered: number): number {
  let tier = 0;
  for (const def of VIP_TIERS) {
    if (wagered >= def.minWagered) tier = def.tier;
  }
  return tier;
}

export function getTierDefinition(tier: number): VipTierDefinition {
  return VIP_TIERS.find((t) => t.tier === tier) || VIP_TIERS[0];
}

export function getNextTier(tier: number): VipTierDefinition | null {
  return VIP_TIERS.find((t) => t.tier === tier + 1) || null;
}

export async function updateVipOnBet(
  userId: string,
  betAmount: number,
  tx: Prisma.TransactionClient
) {
  const existing = await tx.vipProgress.findUnique({ where: { userId } });
  const wagered = Number(existing?.xpEarned || 0) + betAmount;
  const tier = getTierForWagered(wagered);

  if (existing) {
    await tx.vipProgress.update({
      where: { userId },
      data: { xpEarned: wagered, currentTier: tier },
    });
  } else {
    await tx.vipProgress.create({
      data: { userId, xpEarned: wagered, currentTier: tier },
    });
  }
}

export async function calculateWeeklyRakeback(userId: string) {
  const progress = await prisma.vipProgress.findUnique({ where: { userId } });
  const tierDef = getTierDefinition(progress?.currentTier || 0);
  const since = progress?.lastRakebackClaimAt || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const agg = await prisma.transaction.groupBy({
    by: ['type'],
    where: {
      userId,
      status: 'completed',
      type: { in: ['BET', 'WIN'] },
      createdAt: { gt: since },
      gameId: { not: null },
    },
    _sum: { amount: true },
  });

  const wagered = Number(agg.find((a) => a.type === 'BET')?._sum.amount || 0);
  const won = Number(agg.find((a) => a.type === 'WIN')?._sum.amount || 0);
  const netLoss = Math.max(0, wagered - won);
  const claimable = Math.floor(netLoss * tierDef.cashbackRate * 100) / 100;

  return {
    claimable,
    netLoss,
    tierDef,
    since,
    alreadyTracked: Number(progress?.unclaimedRakeback || 0),
  };
}

export async function getVipStatus(userId: string) {
  let progress = await prisma.vipProgress.findUnique({ where: { userId } });
  if (!progress) {
    progress = await prisma.vipProgress.create({
      data: { userId, xpEarned: 0, currentTier: 0 },
    });
  }

  const wagered = Number(progress.xpEarned);
  const current = getTierDefinition(progress.currentTier);
  const next = getNextTier(progress.currentTier);
  const rakeback = await calculateWeeklyRakeback(userId);

  return {
    tier: progress.currentTier,
    tierName: current.name,
    lifetimeWagered: wagered,
    perks: current.benefits,
    cashbackRate: current.cashbackRate,
    withdrawalPriority: current.withdrawalPriority,
    bonusMultiplier: current.bonusMultiplier,
    progressToNext: next
      ? {
          nextTier: next.name,
          nextTierMin: next.minWagered,
          remaining: Math.max(0, next.minWagered - wagered),
          percent: Math.min(100, Math.round((wagered / next.minWagered) * 1000) / 10),
        }
      : null,
    rakeback: {
      claimable: rakeback.claimable,
      netLossSinceLastClaim: rakeback.netLoss,
      lastClaimAt: progress.lastRakebackClaimAt,
    },
    allTiers: VIP_TIERS,
  };
}

export async function claimVipRakeback(userId: string) {
  const rakeback = await calculateWeeklyRakeback(userId);
  if (rakeback.claimable <= 0) {
    throw new Error('No rakeback available to claim');
  }

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { balance: true },
    });

    const amount = new Prisma.Decimal(rakeback.claimable);
    const updated = await tx.user.update({
      where: { id: userId },
      data: { balance: { increment: amount } },
      select: { balance: true },
    });

    await tx.transaction.create({
      data: {
        userId,
        type: 'BONUS',
        amount,
        balanceBefore: user.balance,
        balanceAfter: updated.balance,
        reason: `VIP ${rakeback.tierDef.name} weekly cashback`,
        status: 'completed',
      },
    });

    await tx.vipProgress.update({
      where: { userId },
      data: {
        lastRakebackClaimAt: new Date(),
        unclaimedRakeback: 0,
      },
    });

    return { credited: rakeback.claimable, balance: Number(updated.balance) };
  });
}
