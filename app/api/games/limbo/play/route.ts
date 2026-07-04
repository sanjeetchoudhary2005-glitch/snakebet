
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { placeBet, settleBet } from '@/lib/wallet';
import { generateSeed, hashSeed, generateLimboResult } from '@/lib/provably-fair';
import { auth } from '@/auth';
import { z } from 'zod';
import { enforceBetRateLimit } from '@/lib/rateLimit';
import { isNextResponse, parseJson } from '@/lib/api';

const limboSchema = z.object({
  betAmount: z.number().min(10).max(50000),
  targetMultiplier: z.number().min(1.01).max(100000),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const limited = await enforceBetRateLimit(userId, 'limbo:play');
    if (limited) return limited;

    const parsed = await parseJson(req, limboSchema);
    if (isNextResponse(parsed)) return parsed;
    const { betAmount, targetMultiplier } = parsed;

    const serverSeed = generateSeed();
    const clientSeed = generateSeed();
    const nonce = Date.now();

    const resultMultiplier = generateLimboResult(serverSeed, clientSeed, nonce);
    const won = resultMultiplier >= targetMultiplier;
    const payout = won ? betAmount * targetMultiplier * 0.98 : 0; // 2% house edge

    const roundId = nonce.toString();
    const round = await prisma.$transaction(async (tx) => {
      await placeBet({ userId, gameId: 'limbo', amount: betAmount, roundId }, tx);
      if (won) {
        await settleBet({ userId, gameId: 'limbo', roundId, payout }, tx);
      }

      return tx.limboRound.create({
        data: {
          userId,
          betAmount,
          targetMultiplier,
          resultMultiplier,
          won,
          serverSeed,
          serverSeedHash: hashSeed(serverSeed),
          clientSeed,
          nonce: BigInt(nonce),
        },
      });
    });

    return NextResponse.json({
      roundId: round.id,
      resultMultiplier,
      won,
      payout,
      serverSeedHash: hashSeed(serverSeed),
      clientSeed,
      nonce,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to play Limbo' }, { status: 500 });
  }
}
