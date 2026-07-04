import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  BlackjackCard,
  calculateBlackjackScore,
} from '@/lib/provably-fair';
import { auth } from '@/auth';
import { z } from 'zod';
import { isNextResponse, parseJson } from '@/lib/api';
import { placeBet } from '@/lib/wallet';

const roundSchema = z.object({
  roundId: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const parsed = await parseJson(req, roundSchema);
    if (isNextResponse(parsed)) return parsed;
    const { roundId } = parsed;

    const round = await prisma.blackjackRound.findUnique({
      where: { id: roundId },
    });

    if (!round || round.userId !== userId) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }

    if (round.status !== 'player_turn') {
      return NextResponse.json({ error: 'Invalid round status' }, { status: 400 });
    }

    let playerHand: BlackjackCard[] = JSON.parse(round.playerHand);
    const isAlreadySplit = playerHand && typeof playerHand === 'object' && !Array.isArray(playerHand);

    if (isAlreadySplit || playerHand.length !== 2 || playerHand[0].rank !== playerHand[1].rank) {
      return NextResponse.json({ error: 'Split only allowed on matching pairs of initial hand' }, { status: 400 });
    }

    const originalBet = Number(round.betAmount);
    const roundRef = round.nonce.toString();

    // Place the matching bet for the split hand
    await prisma.$transaction(async (tx) => {
      await placeBet({ userId, gameId: 'blackjack', amount: originalBet, roundId: roundRef }, tx);
    });

    const deck: BlackjackCard[] = JSON.parse(round.deck);
    let currentIndex = round.currentIndex;

    // Split the hand and draw one card for each hand
    const hand0 = [playerHand[0], deck[currentIndex++]];
    const hand1 = [playerHand[1], deck[currentIndex++]];

    const playerHandData = {
      hands: [hand0, hand1],
      activeHandIndex: 0,
      isSplit: true,
    };

    // Save states
    await prisma.blackjackRound.update({
      where: { id: roundId },
      data: {
        betAmount: originalBet * 2, // Total bet is now doubled
        playerHand: JSON.stringify(playerHandData),
        currentIndex,
      },
    });

    return NextResponse.json({
      playerHand: playerHandData,
      dealerHand: [JSON.parse(round.dealerHand)[0], null],
      status: 'player_turn',
    });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Failed to split' }, { status: 500 });
  }
}
