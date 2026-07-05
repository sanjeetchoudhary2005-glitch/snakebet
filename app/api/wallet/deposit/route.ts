import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isNextResponse, parseJson } from '@/lib/api';
import { assertWithinDailyDepositLimit } from '@/lib/responsibleGaming';

const depositSchema = z.object({
  amount: z.number().positive().min(200).max(100000),
  method: z.enum(['manual', 'upi', 'card']).default('manual'),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = await parseJson(req, depositSchema);
    if (isNextResponse(parsed)) return parsed;
    await assertWithinDailyDepositLimit(session.user.id, parsed.amount);

    const amount = new Prisma.Decimal(parsed.amount);
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, balance: true },
      });
      if (!user) throw new Error('User not found');

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          balance: { increment: amount },
          totalDeposited: { increment: amount },
        },
        select: { balance: true },
      });

      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'DEPOSIT',
          amount,
          balanceBefore: user.balance,
          balanceAfter: updatedUser.balance,
          method: parsed.method.toUpperCase(),
          status: 'COMPLETED',
          reference: `manual:${Date.now()}`,
        },
      });

      return { transaction, newBalance: updatedUser.balance };
    });

    return NextResponse.json({
      success: true,
      newBalance: result.newBalance,
      transactionId: result.transaction.id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to deposit' },
      { status: error.message === 'User not found' ? 404 : error.message === 'Daily deposit limit exceeded' ? 400 : 500 }
    );
  }
}
