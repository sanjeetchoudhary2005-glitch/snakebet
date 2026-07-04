import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { settleBet, placeBet } from '@/lib/wallet';
import { calculateHandValue, CardData } from '@/lib/blackjack-utils';

export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const { roundId, action } = await (req.json() as { roundId: string, action: "hit" | "stand" | "double" });

    if (!roundId || !["hit", "stand", "double"].includes(action)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const round = await prisma.blackjackRound.findUnique({ where: { id: roundId } });
    if (!round || round.userId !== user.id) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }
    
    if (round.status !== 'player-turn') {
      return NextResponse.json({ error: 'Invalid game state' }, { status: 400 });
    }

    let deck: CardData[] = JSON.parse(round.deck);
    let playerHand: CardData[] = JSON.parse(round.playerHand);
    let dealerHand: CardData[] = JSON.parse(round.dealerHand);
    let betAmount = Number(round.betAmount);
    let phase = round.status;
    let outcome = null;
    let payout = 0;

    if (action === "double") {
      if (playerHand.length > 2) {
        return NextResponse.json({ error: 'Cannot double down after hitting' }, { status: 400 });
      }
      // Deduct the extra bet
      const walletRes = await placeBet(user.id, betAmount);
      if (!walletRes) {
        return NextResponse.json({ error: 'Insufficient balance to double' }, { status: 400 });
      }
      betAmount *= 2;
    }

    if (action === "hit" || action === "double") {
      playerHand.push(deck.pop()!);
      const playerValue = calculateHandValue(playerHand);
      
      if (playerValue > 21) {
        phase = "settled";
        outcome = "BUST";
      } else if (action === "double") {
        phase = "dealer-turn"; // Force stand after double
      }
    } else if (action === "stand") {
      phase = "dealer-turn";
    }

    // Dealer turn logic
    if (phase === "dealer-turn") {
       let dealerValue = calculateHandValue(dealerHand);
       const playerValue = calculateHandValue(playerHand);
       
       // Dealer hits on soft 17 and below 17
       while (dealerValue < 17) {
         dealerHand.push(deck.pop()!);
         dealerValue = calculateHandValue(dealerHand);
       }
       
       phase = "settled";
       if (dealerValue > 21) {
          outcome = "WIN";
          payout = betAmount * 2;
       } else if (dealerValue > playerValue) {
          outcome = "LOSE";
       } else if (dealerValue < playerValue) {
          outcome = "WIN";
          payout = betAmount * 2;
       } else {
          outcome = "PUSH";
          payout = betAmount;
       }
    }

    // Save state
    await prisma.blackjackRound.update({
      where: { id: round.id },
      data: {
        playerHand: JSON.stringify(playerHand),
        dealerHand: JSON.stringify(dealerHand),
        deck: JSON.stringify(deck),
        status: phase,
        betAmount,
        payout,
      }
    });

    if (payout > 0) {
      await settleBet(user.id, payout, 'blackjack', round.id);
    }

    return NextResponse.json({
      playerHand,
      dealerHand: phase === "settled" ? dealerHand : [dealerHand[0], { rank: "?", suit: "?", value: 0 }],
      phase,
      outcome,
      payout
    });

  } catch (err: any) {
    console.error('Blackjack action error:', err);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}
