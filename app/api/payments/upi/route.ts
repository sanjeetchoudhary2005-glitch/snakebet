import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { isNextResponse, parseJson } from '@/lib/api';
import { assertWithinDailyDepositLimit } from '@/lib/responsibleGaming';

const MIN_DEPOSIT = 200;
const upiSchema = z.object({
  amount: z.number().min(MIN_DEPOSIT).max(100000),
  upiId: z.string().trim().min(3).max(120).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = await parseJson(req, upiSchema);
    if (isNextResponse(parsed)) return parsed;
    const { amount, upiId } = parsed;
    const userId = session.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    await assertWithinDailyDepositLimit(userId, amount);

    const merchantUpiId = upiId || process.env.NEXT_PUBLIC_UPI_ID;
    if (!merchantUpiId) {
      return NextResponse.json({ error: 'UPI payments are not configured' }, { status: 400 });
    }

    // Create pending transaction
    const txn = await prisma.transaction.create({
      data: {
        userId,
        amount,
        type: 'DEPOSIT',
        status: 'PENDING',
        method: 'UPI',
        reference: `UPI_${Date.now()}`,
        balanceBefore: user.balance,
        balanceAfter: user.balance,
      }
    });

    // Generate UPI link
    const upiLink = `upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=Snakebet&am=${amount}&cu=INR`;

    return NextResponse.json({ upiLink, txnId: txn.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create UPI payment';
    console.error(error);
    return NextResponse.json({ error: message }, { status: message === 'Daily deposit limit exceeded' ? 400 : 500 });
  }
}
