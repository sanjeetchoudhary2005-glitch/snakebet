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
import { settleBet } from '@/lib/wallet';

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

    const deck: BlackjackCard[] = JSON.parse(round.deck);
    const dealerHand: BlackjackCard[] = JSON.parse(round.dealerHand);
    let currentIndex = round.currentIndex;

    let playerHandData = JSON.parse(round.playerHand);
    const isSplit = playerHandData && typeof playerHandData === 'object' && playerHandData.isSplit;

    let status = 'player_turn';
    let payout = 0;

    if (isSplit) {
      const activeIdx = playerHandData.activeHandIndex;
      if (activeIdx === 0) {
        // Stand on hand 1, switch to hand 2
        playerHandData.activeHandIndex = 1;
      } else {
        // Stand on hand 2, complete player turn
        status = 'dealer_turn';
      }
    } else {
      // Standard hand
      status = 'dealer_turn';
    }

    // Save state
    await prisma.blackjackRound.update({
      where: { id: roundId },
      data: {
        playerHand: JSON.stringify(playerHandData),
        status,
      },
    });

    // Handle Dealer's turn if triggered
    if (status === 'dealer_turn') {
      let dealerScore = calculateBlackjackScore(dealerHand);
      while (shouldDealerHit(dealerScore)) {
        dealerHand.push(deck[currentIndex++]);
        dealerScore = calculateBlackjackScore(dealerHand);
      }

      // Calculate payout based on split or standard
      if (isSplit) {
        const betPerHandAmount = Number(round.betAmount) / 2;
        let payout0 = 0;
        let payout1 = 0;

        const score0 = calculateBlackjackScore(playerHandData.hands[0]);
        const score1 = calculateBlackjackScore(playerHandData.hands[1]);

        // Hand 0 settle
        if (score0 <= 21) {
          if (dealerScore > 21 || score0 > dealerScore) payout0 = betPerHandAmount * 2 * 0.98;
          else if (score0 === dealerScore) payout0 = betPerHandAmount;
        }

        // Hand 1 settle
        if (score1 <= 21) {
          if (dealerScore > 21 || score1 > dealerScore) payout1 = betPerHandAmount * 2 * 0.98;
          else if (score1 === dealerScore) payout1 = betPerHandAmount;
        }

        payout = payout0 + payout1;
      } else {
        const playerScore = calculateBlackjackScore(playerHandData);
        if (dealerScore > 21 || playerScore > dealerScore) {
          payout = Number(round.betAmount) * 2 * 0.98;
        } else if (playerScore === dealerScore) {
          payout = Number(round.betAmount);
        } else {
          payout = 0;
        }
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
        playerHand: playerHandData,
        dealerHand,
        playerScore: isSplit ? null : calculateBlackjackScore(playerHandData),
        dealerScore,
        status: 'settled',
        payout,
      });
    }

    return NextResponse.json({
      playerHand: playerHandData,
      dealerHand: [dealerHand[0], null],
      playerScore: isSplit ? null : calculateBlackjackScore(playerHandData),
      status,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to stand' }, { status: 500 });
  }
}
