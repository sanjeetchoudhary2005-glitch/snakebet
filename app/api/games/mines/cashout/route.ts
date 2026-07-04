
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { settleBet } from '@/lib/wallet';
import { auth } from '@/auth';
import { z } from 'zod';
import { isNextResponse, parseJson } from '@/lib/api';

const cashoutSchema = z.object({
  roundId: z.string().min(1),
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
    const { roundId } = parsed;

    const round = await prisma.minesRound.findUnique({
      where: { id: roundId },
    });

    if (!round || round.userId !== userId) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }

    if (round.status !== 'active') {
      return NextResponse.json({ error: 'Round already ended' }, { status: 400 });
    }

    const payout = parseFloat(round.betAmount.toString()) * round.currentMultiplier;

    // All in atomic transaction
    const updatedRound = await prisma.$transaction(async (tx) => {
      const cashedOut = await tx.minesRound.updateMany({
        where: { id: roundId, userId, status: 'active' },
        data: {
          status: 'cashed_out',
        },
      });
      if (cashedOut.count !== 1) {
        throw new Error('Round already ended');
      }

      // Settle bet via wallet
      await settleBet({
        userId,
        gameId: 'mines',
        roundId: roundId,
        payout,
      }, tx);
    });

    return NextResponse.json({
      payout,
      serverSeed: round.serverSeed,
      minePositions: JSON.parse(round.minePositions),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to cash out' }, { status: 500 });
  }
}
