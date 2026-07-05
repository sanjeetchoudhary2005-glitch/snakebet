import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { isNextResponse, parseJson } from '@/lib/api';
import { assertWithinDailyDepositLimit } from '@/lib/responsibleGaming';

const MIN_DEPOSIT = 200;
const cryptoSchema = z.object({
  amount: z.number().min(MIN_DEPOSIT).max(100000),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = await parseJson(req, cryptoSchema);
    if (isNextResponse(parsed)) return parsed;
    const { amount } = parsed;
    const userId = session.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    await assertWithinDailyDepositLimit(userId, amount);

    const depositAddress = process.env.CRYPTO_DEPOSIT_ADDRESS;
    if (!depositAddress) {
      return NextResponse.json({ error: 'Crypto payments are not configured' }, { status: 400 });
    }

    // Create pending transaction
    const txn = await prisma.transaction.create({
      data: {
        userId,
        amount,
        type: 'DEPOSIT',
        status: 'PENDING',
        method: 'CRYPTO',
        reference: `CRYPTO_${Date.now()}`,
        balanceBefore: user.balance,
        balanceAfter: user.balance,
      }
    });

    return NextResponse.json({
      address: depositAddress,
      currency: 'USDT',
      txnId: txn.id
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create crypto payment';
    console.error(error);
    return NextResponse.json({ error: message }, { status: message === 'Daily deposit limit exceeded' ? 400 : 500 });
  }
}
