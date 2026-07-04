
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { placeBet, settleBet } from '@/lib/wallet';
import { generateSeed, rollDicePrecise } from '@/lib/provably-fair';
import { auth } from '@/auth';
import { z } from 'zod';
import { enforceBetRateLimit } from '@/lib/rateLimit';
import { isNextResponse, parseJson } from '@/lib/api';

const HOUSE_EDGE = 0.01;
const diceSchema = z.object({
  betAmount: z.number().positive().min(10).max(50000),
  target: z.number().min(0.01).max(99.99),
  direction: z.enum(['over', 'under']),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const limited = await enforceBetRateLimit(userId, 'dice:play');
    if (limited) return limited;

    const parsed = await parseJson(req, diceSchema);
    if (isNextResponse(parsed)) return parsed;
    const { betAmount, target, direction } = parsed;

    // Generate seeds first (all deterministic)
    const serverSeed = generateSeed();
    const clientSeed = generateSeed();
    const now = Date.now();
    const roundId = now.toString();
    const nonce = now % 2147483647;

    // Roll the dice
    const roll = rollDicePrecise(serverSeed, clientSeed, nonce);

    // Determine if won
    let won = false;
    let winChance = 0;
    if (direction === 'over') {
      winChance = (100 - target) / 100;
      won = roll > target;
    } else {
      winChance = target / 100;
      won = roll < target;
    }

    // Calculate payout
    const multiplier = (1 / winChance) * (1 - HOUSE_EDGE);
    const payout = won ? betAmount * multiplier : 0;

    // All in a single atomic transaction!
    const result = await prisma.$transaction(async (tx) => {
      // Place bet first
      await placeBet({ userId, gameId: 'dice', roundId, amount: betAmount }, tx);

      // Settle if won
      if (won) {
        await settleBet({ userId, gameId: 'dice', roundId, payout }, tx);
      }

      // Save round to DB
      const round = await tx.diceRound.create({
        data: {
          userId,
          betAmount,
          target,
          direction,
          roll,
          won,
          payout,
          serverSeed,
          clientSeed,
          nonce: BigInt(nonce),
        },
      });

      return { round };
    });

    return NextResponse.json({
      roll,
      won,
      payout,
      serverSeed,
      clientSeed,
      nonce,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to play dice' }, { status: 500 });
  }
}
