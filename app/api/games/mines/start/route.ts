
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { placeBet } from '@/lib/wallet';
import { generateSeed, hashSeed, placeMines } from '@/lib/provably-fair';
import { auth } from '@/auth';
import { z } from 'zod';
import { enforceBetRateLimit } from '@/lib/rateLimit';
import { isNextResponse, parseJson } from '@/lib/api';

const startSchema = z.object({
  betAmount: z.number().positive().min(10).max(50000),
  mineCount: z.number().int().min(1).max(24),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const limited = await enforceBetRateLimit(userId, 'mines:start');
    if (limited) return limited;

    const parsed = await parseJson(req, startSchema);
    if (isNextResponse(parsed)) return parsed;
    const { betAmount, mineCount } = parsed;

    // Generate seeds first
    const serverSeed = generateSeed();
    const serverSeedHash = hashSeed(serverSeed);
    const clientSeed = generateSeed();
    const nonce = 0;

    // Generate deterministic mine positions
    const minePositions = placeMines(serverSeed, clientSeed, nonce, mineCount);

    // All in atomic transaction
    const round = await prisma.$transaction(async (tx) => {
      // Place the bet via wallet
      await placeBet({ userId, gameId: 'mines', amount: betAmount }, tx);

      // Create MinesRound record
      return tx.minesRound.create({
        data: {
          userId,
          betAmount,
          mineCount,
          minePositions: JSON.stringify(minePositions),
          serverSeed,
          serverSeedHash,
          clientSeed,
          nonce: BigInt(nonce),
        },
      });
    });

    return NextResponse.json({
      roundId: round.id,
      serverSeedHash,
      clientSeed,
      nonce,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to start game' }, { status: 500 });
  }
}
