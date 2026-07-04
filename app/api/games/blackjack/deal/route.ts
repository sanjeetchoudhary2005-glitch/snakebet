import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { generateSeed, hashSeed } from '@/lib/provably-fair';
import { placeBet, settleBet } from '@/lib/wallet';
import { createDeck, shuffleDeck, calculateHandValue, CardData } from '@/lib/blackjack-utils';
import crypto from 'crypto';

export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const { betAmount } = await (req.json() as { betAmount: number });

    if (!betAmount || betAmount <= 0) {
      return NextResponse.json({ error: 'Invalid bet amount' }, { status: 400 });
    }

    // Deduct bet amount
    const walletRes = await placeBet(user.id, betAmount);
    if (!walletRes) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    const serverSeed = generateSeed();
    const serverSeedHash = hashSeed(serverSeed);
    const clientSeed = crypto.randomBytes(16).toString('hex');
    const nonce = 1n; // Starting nonce

    // Shuffle deck
    const deck = shuffleDeck(createDeck(), serverSeed, clientSeed, 1);
    
    // Deal initial cards: Player, Dealer, Player, Dealer
    const playerHand = [deck.pop()!, deck.pop()!];
    const dealerHand = [deck.pop()!, deck.pop()!];
    const currentIndex = 52 - 4; // We drew 4 cards

    const playerValue = calculateHandValue(playerHand);
    const dealerValue = calculateHandValue(dealerHand);
    
    let phase = "player-turn";
    let outcome = null;
    let payout = 0;

    // Check for immediate blackjack
    if (playerValue === 21) {
      if (dealerValue === 21) {
        phase = "settled";
        outcome = "PUSH";
        payout = betAmount;
      } else {
        phase = "settled";
        outcome = "BLACKJACK";
        payout = betAmount * 2.5; // 3:2 payout (original bet + 1.5x)
      }
    }

    const round = await prisma.blackjackRound.create({
      data: {
        userId: user.id,
        betAmount,
        deck: JSON.stringify(deck),
        playerHand: JSON.stringify(playerHand),
        dealerHand: JSON.stringify(dealerHand),
        currentIndex,
        status: phase,
        payout: payout,
        serverSeed,
        serverSeedHash,
        clientSeed,
        nonce,
      }
    });

    if (payout > 0) {
       await settleBet(user.id, payout, 'blackjack', round.id);
    }

    return NextResponse.json({
      roundId: round.id,
      playerHand,
      dealerHand: phase === "settled" ? dealerHand : [dealerHand[0], { rank: "?", suit: "?", value: 0 }],
      phase,
      outcome,
      payout,
      serverSeedHash,
    });
  } catch (err: any) {
    console.error('Blackjack deal error:', err);
    return NextResponse.json({ error: 'Failed to deal hand' }, { status: 500 });
  }
}
