import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { auth } from '@/auth';
import { isNextResponse, parseJson } from '@/lib/api';

const MIN_WITHDRAWAL = 1000;
const withdrawSchema = z.object({
  amount: z.number().min(MIN_WITHDRAWAL).max(500000),
  method: z.string().transform((value) => value.toUpperCase()).pipe(z.enum(['UPI', 'BANK'])),
  upiId: z.string().trim().min(3).max(120).optional(),
  accountDetails: z.record(z.string(), z.unknown()).optional().default({}),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = await parseJson(req, withdrawSchema);
    if (isNextResponse(parsed)) return parsed;
    const { amount, method, upiId } = parsed;
    const accountDetails = upiId ? { ...parsed.accountDetails, upiId } : parsed.accountDetails;
    const userId = session.user.id;

    const withdraw = await prisma.$transaction(async (tx) => {
      const amountDecimal = new Prisma.Decimal(amount);
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { balance: true },
      });
      if (!user) throw new Error('User not found');

      const debited = await tx.user.updateMany({
        where: { id: userId, balance: { gte: amountDecimal } },
        data: {
          balance: { decrement: amountDecimal },
          totalWithdrawn: { increment: amountDecimal },
        },
      });
      if (debited.count !== 1) {
        throw new Error('Insufficient balance');
      }
      const updatedUser = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: { balance: true },
      });
      const request = await tx.withdrawRequest.create({
        data: {
          userId,
          amount,
          method,
          accountDetails: JSON.stringify(accountDetails),
          status: 'PENDING',
        }
      });
      const transaction = await tx.transaction.create({
        data: {
          userId,
          type: 'WITHDRAWAL',
          amount: amountDecimal,
          balanceBefore: user.balance,
          balanceAfter: updatedUser.balance,
          method,
          reference: request.id,
          status: 'PENDING',
        },
      });
      return { request, transaction };
    });

    return NextResponse.json({
      success: true,
      status: 'PENDING',
      requestId: withdraw.request.id,
      transactionId: withdraw.transaction.id,
    });
  } catch (error: any) {
    const message = error.message || 'Failed to create withdraw request';
    return NextResponse.json({ error: message }, { status: message === 'Insufficient balance' ? 400 : 500 });
  }
}
