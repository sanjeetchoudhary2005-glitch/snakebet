import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function claimPromotion(userId: string, promotionId: string) {
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const promotion = await tx.promotion.findFirst({
      where: {
        id: promotionId,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    if (!promotion) {
      throw new Error('Promotion not found or no longer active');
    }

    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { balance: true, totalDeposited: true, createdAt: true },
    });

    const minDeposit = Number(promotion.minDepositRequired || 0);
    if (Number(user.totalDeposited) < minDeposit) {
      throw new Error(`Minimum deposit of ₹${minDeposit.toLocaleString()} required`);
    }

    if (promotion.type === 'WELCOME') {
      const priorWelcome = await tx.promotionClaim.findFirst({
        where: {
          userId,
          promotion: { type: 'WELCOME' },
        },
      });
      if (priorWelcome) {
        throw new Error('Welcome bonus already claimed');
      }
    }

    const bonusBase = Math.min(
      Number(promotion.maxBonus),
      Number(user.totalDeposited) * (promotion.matchPercentage / 100)
    );

    if (bonusBase <= 0) {
      throw new Error('Not eligible for this promotion');
    }

    const amount = new Prisma.Decimal(bonusBase);

    try {
      await tx.promotionClaim.create({
        data: {
          userId,
          promotionId,
          amountCredited: amount,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new Error('Promotion already claimed');
      }
      throw error;
    }

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
        reason: `Promotion: ${promotion.title}`,
        status: 'completed',
      },
    });

    return {
      promotionId,
      amountCredited: bonusBase,
      balance: Number(updated.balance),
    };
  });
}
