import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { creditPayout } from '@/lib/wallet';
import { auth } from '@/auth';
import { z } from 'zod';
import { isNextResponse, parseJson } from '@/lib/api';

const cashoutSchema = z.object({
  betAmount: z.number().positive().min(1).max(100000),
  multiplier: z.number().min(1).max(10000),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const parsed = await parseJson(req, cashoutSchema);
    if (isNextResponse(parsed)) return parsed;
    const { betAmount, multiplier } = parsed;

    const payout = Math.round(betAmount * multiplier * 100) / 100;

    const result = await prisma.$transaction(async (tx) => {
      const game = await tx.game.create({
        data: {
          userId,
          type: 'CRASH',
          betAmount,
          multiplier,
          result: 'WIN',
          winAmount: payout,
          details: JSON.stringify({ crashCashout: true, multiplier }),
        },
      });

      await creditPayout(
        { userId, gameId: 'crash', roundId: game.id, payout },
        tx
      );

      return game;
    });

    return NextResponse.json({ payout, game: result });
  } catch (error: any) {
    console.error('Crash cashout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process cashout' },
      { status: 500 }
    );
  }
}
