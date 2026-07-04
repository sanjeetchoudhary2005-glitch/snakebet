import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin';
import { isNextResponse, parseJson } from '@/lib/api';

type RouteParams = { params: Promise<{ id: string }> };

const adjustmentSchema = z.object({
  amount: z.number().min(-1_000_000).max(1_000_000).refine((value) => value !== 0, {
    message: 'Amount cannot be zero',
  }),
  reason: z.string().trim().min(3).max(500),
});

export async function POST(req: Request, { params }: RouteParams) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const parsed = await parseJson(req, adjustmentSchema);
  if (isNextResponse(parsed)) return parsed;

  const { id } = await params;
  const adjustment = await prisma.$transaction(async (tx) => {
    const amount = new Prisma.Decimal(parsed.amount);
    const user = await tx.user.findUnique({
      where: { id },
      select: { id: true, balance: true },
    });
    if (!user) throw new Error('User not found');

    const nextBalance = new Prisma.Decimal(user.balance).plus(amount);
    if (nextBalance.lessThan(0)) {
      throw new Error('Adjustment would make balance negative');
    }

    const updatedUser = await tx.user.update({
      where: { id },
      data: { balance: nextBalance },
      select: { balance: true },
    });

    const transaction = await tx.transaction.create({
      data: {
        userId: id,
        type: 'ADMIN_ADJUSTMENT',
        amount,
        balanceBefore: user.balance,
        balanceAfter: updatedUser.balance,
        status: 'completed',
        method: 'ADMIN',
        reference: `admin:${admin.userId}`,
        reason: parsed.reason,
        adminUserId: admin.userId,
      },
    });

    await tx.adminLog.create({
      data: {
        adminId: admin.userId,
        action: 'LEDGER_ADJUSTMENT',
        targetId: id,
        details: JSON.stringify({
          amount: parsed.amount,
          reason: parsed.reason,
          transactionId: transaction.id,
        }),
      },
    });

    return transaction;
  });

  return NextResponse.json({ adjustment });
}
