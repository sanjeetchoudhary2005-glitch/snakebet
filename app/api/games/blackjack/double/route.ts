import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  BlackjackCard,
  calculateBlackjackScore,
  shouldDealerHit,
} from '@/lib/provably-fair';
import { auth } from '@/auth';
import { z } from 'zod';
import { isNextResponse, parseJson } from '@/lib/api';
import { placeBet, settleBet } from '@/lib/wallet';

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

    // Double is only allowed on the first two cards
    let playerHand: BlackjackCard[] = JSON.parse(round.playerHand);
    const isSplit = playerHand && typeof playerHand === 'object' && !Array.isArray(playerHand);
    
    if (isSplit || playerHand.length !== 2) {
      return NextResponse.json({ error: 'Double down only allowed on initial hand' }, { status: 400 });
    }

    const originalBet = Number(round.betAmount);
    const roundRef = round.nonce.toString();

    // Check if player has enough balance to double the bet
    const deck: BlackjackCard[] = JSON.parse(round.deck);
    let dealerHand: BlackjackCard[] = JSON.parse(round.dealerHand);
    let currentIndex = round.currentIndex;

    // Place the double down bet
    await prisma.$transaction(async (tx) => {
      await placeBet({ userId, gameId: 'blackjack', amount: originalBet, roundId: roundRef }, tx);
    });

    // Deal exactly one more card
    playerHand.push(deck[currentIndex++]);
    const playerScore = calculateBlackjackScore(playerHand);

    let status = 'dealer_turn';
    let payout = 0;

    if (playerScore > 21) {
      status = 'settled';
      payout = 0;
    }

    // Save states
    await prisma.blackjackRound.update({
      where: { id: roundId },
      data: {
        betAmount: originalBet * 2, // Total bet is now doubled
        playerHand: JSON.stringify(playerHand),
        currentIndex,
        status,
        payout,
      },
    });

    // Handle Dealer's turn if triggered
    if (status === 'dealer_turn') {
      let dealerScore = calculateBlackjackScore(dealerHand);
      while (shouldDealerHit(dealerScore)) {
        dealerHand.push(deck[currentIndex++]);
        dealerScore = calculateBlackjackScore(dealerHand);
      }

      // Determine outcome
      if (dealerScore > 21 || playerScore > dealerScore) {
        payout = originalBet * 2 * 2 * 0.98; // Doubled bet * 2 * house edge margin
      } else if (playerScore === dealerScore) {
        payout = originalBet * 2; // Return the doubled bet
      } else {
        payout = 0;
      }

      await prisma.$transaction(async (tx) => {
        if (payout > 0) {
          await settleBet({ userId, gameId: 'blackjack', roundId, payout }, tx);
        }
        await tx.blackjackRound.update({
          where: { id: roundId },
          data: {
            dealerHand: JSON.stringify(dealerHand),
            currentIndex,
            status: 'settled',
            payout,
          },
        });
      });

      return NextResponse.json({
        playerHand,
        dealerHand,
        playerScore,
        dealerScore,
        status: 'settled',
        payout,
      });
    }

    return NextResponse.json({
      playerHand,
      dealerHand,
      playerScore,
      status: 'settled',
      payout,
    });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Failed to double down' }, { status: 500 });
  }
}
