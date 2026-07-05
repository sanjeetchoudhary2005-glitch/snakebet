import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { generateSeed, hashSeed } from '@/lib/provably-fair';
import { placeBet } from '@/lib/wallet';
import { enforceBetRateLimit } from '@/lib/rateLimit';
import { isNextResponse, parseJson } from '@/lib/api';
import { shuffleDeck } from '@/lib/games/card-games';

const startSchema = z.object({
  betAmount: z.number().positive().min(10).max(50000),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const limited = await enforceBetRateLimit(userId, 'teen-patti:start');
    if (limited) return limited;

    const parsed = await parseJson(req, startSchema);
    if (isNextResponse(parsed)) return parsed;
    const { betAmount } = parsed; // Ante bet

    const serverSeed = generateSeed();
    const clientSeed = generateSeed();
    const nonce = Date.now();
    const serverSeedHash = hashSeed(serverSeed);

    // Shuffle and deal cards
    const deck = shuffleDeck(serverSeed, clientSeed, nonce);
    const playerHand = [deck[0], deck[1], deck[2]];
    const dealerHand = [deck[3], deck[4], deck[5]];

    const roundRef = `teen-patti:${nonce}`;

    const round = await prisma.$transaction(async (tx) => {
      // Place Ante bet
      await placeBet({ userId, gameId: 'teen-patti', amount: betAmount, roundId: roundRef }, tx);

      // Save round state with multiplier = -1 indicating active/pending
      return tx.teenPattiRound.create({
        data: {
          userId,
          betAmount,
          cards: JSON.stringify({ playerHand, dealerHand, status: 'active' }),
          handRank: '', // Settled hand rank will be stored during showdown
          multiplier: -1, 
          serverSeed,
          serverSeedHash,
          clientSeed,
          nonce: BigInt(nonce),
        },
      });
    });

    return NextResponse.json({
      success: true,
      roundId: round.id,
      playerHand,
      serverSeedHash,
      clientSeed,
      nonce,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Failed to start Teen Patti' }, { status: 500 });
  }
}
