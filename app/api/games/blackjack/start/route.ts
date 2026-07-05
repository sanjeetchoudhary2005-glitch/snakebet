
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { placeBet } from '@/lib/wallet';
import {
  generateSeed,
  hashSeed,
  shuffleBlackjackDeck,
  BlackjackCard,
  calculateBlackjackScore,
} from '@/lib/provably-fair';
import { auth } from '@/auth';
import { z } from 'zod';
import { isNextResponse, parseJson } from '@/lib/api';
import { enforceBetRateLimit } from '@/lib/rateLimit';
import { settleBet } from '@/lib/wallet';

const startSchema = z.object({
  betAmount: z.number().min(50).max(100000),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const limited = await enforceBetRateLimit(userId, 'blackjack:start');
    if (limited) return limited;

    const parsed = await parseJson(req, startSchema);
    if (isNextResponse(parsed)) return parsed;
    const { betAmount } = parsed;

    const serverSeed = generateSeed();
    const clientSeed = generateSeed();
    const nonce = Date.now();

    const deck = shuffleBlackjackDeck(serverSeed, clientSeed, nonce);

    // Deal initial hands: player 2 cards, dealer 2 cards (one hidden)
    let currentIndex = 0;
    const playerHand: BlackjackCard[] = [deck[currentIndex++], deck[currentIndex++]];
    const dealerHand: BlackjackCard[] = [deck[currentIndex++], deck[currentIndex++]];

    const playerScore = calculateBlackjackScore(playerHand);
    const dealerScore = calculateBlackjackScore(dealerHand);

    // Check for blackjack
    const playerHasBlackjack = playerScore === 21;
    const dealerHasBlackjack = dealerScore === 21;

    let status = 'player_turn';
    let payout = 0;

    if (playerHasBlackjack || dealerHasBlackjack) {
      status = 'settled';
      if (playerHasBlackjack && !dealerHasBlackjack) {
        payout = betAmount * 2.5 * 0.98; // Blackjack pays 3:2, minus house edge
      } else if (playerHasBlackjack && dealerHasBlackjack) {
        payout = betAmount; // Push
      }
    }

    const roundId = nonce.toString();
    const round = await prisma.$transaction(async (tx) => {
      await placeBet({ userId, gameId: 'blackjack', amount: betAmount, roundId }, tx);
      if (payout > 0) {
        await settleBet({ userId, gameId: 'blackjack', roundId, payout }, tx);
      }
      return tx.blackjackRound.create({
        data: {
          userId,
          betAmount,
          deck: JSON.stringify(deck),
          playerHand: JSON.stringify(playerHand),
          dealerHand: JSON.stringify(dealerHand),
          currentIndex,
          status,
          payout,
          serverSeed,
          serverSeedHash: hashSeed(serverSeed),
          clientSeed,
          nonce: BigInt(nonce),
        },
      });
    });

    return NextResponse.json({
      roundId: round.id,
      playerHand,
      dealerHand: [dealerHand[0], null], // Only show first dealer card initially
      playerScore,
      dealerScore: calculateBlackjackScore([dealerHand[0]]), // Only show first dealer card's score
      status,
      payout,
      serverSeedHash: hashSeed(serverSeed),
      clientSeed,
      nonce,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to start blackjack' }, { status: 500 });
  }
}
