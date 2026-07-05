import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin';
import { isNextResponse, parseJson } from '@/lib/api';

const adjustmentSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().min(-1_000_000).max(1_000_000).refine((value) => value !== 0, {
    message: 'Amount cannot be zero',
  }),
  reason: z.string().trim().min(5).max(500),
});

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const [adjustments, users] = await Promise.all([
    prisma.transaction.findMany({
      where: { type: 'ADJUSTMENT' },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { username: true, email: true } } },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: { id: true, username: true, email: true, balance: true },
    }),
  ]);

  return NextResponse.json({ adjustments, users });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const parsed = await parseJson(req, adjustmentSchema);
  if (isNextResponse(parsed)) return parsed;

  const adjustment = await prisma.$transaction(async (tx) => {
    const amount = new Prisma.Decimal(parsed.amount);
    const user = await tx.user.findUnique({
      where: { id: parsed.userId },
      select: { id: true, balance: true },
    });
    if (!user) throw new Error('User not found');

    const nextBalance = new Prisma.Decimal(user.balance).plus(amount);
    if (nextBalance.lessThan(0)) {
      throw new Error('Adjustment would make balance negative');
    }

    const updatedUser = await tx.user.update({
      where: { id: parsed.userId },
      data: { balance: nextBalance },
      select: { id: true, balance: true },
    });

    const transaction = await tx.transaction.create({
      data: {
        userId: parsed.userId,
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
        targetId: parsed.userId,
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
