import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BlackjackCard } from '@/lib/provably-fair';
import { auth } from '@/auth';
import { z } from 'zod';
import { isNextResponse, parseJson } from '@/lib/api';

const guessSchema = z.object({
  roundId: z.string().min(1),
  guess: z.enum(['higher', 'lower', 'equal']),
});

function getCardValue(card: BlackjackCard): number {
  switch (card.rank) {
    case 'A': return 14;
    case 'K': return 13;
    case 'Q': return 12;
    case 'J': return 11;
    default: return parseInt(card.rank);
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const parsed = await parseJson(req, guessSchema);
    if (isNextResponse(parsed)) return parsed;
    const { roundId, guess } = parsed;

    const round = await prisma.hiLoRound.findUnique({
      where: { id: roundId },
    });

    if (!round || round.userId !== userId) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }

    if (round.status !== 'active') {
      return NextResponse.json({ error: 'Round is not active' }, { status: 400 });
    }

    const deck: BlackjackCard[] = JSON.parse(round.deck);
    const currentIndex = round.currentIndex;
    const currentCard = deck[currentIndex];
    const nextIndex = currentIndex + 1;

    if (nextIndex >= deck.length) {
      return NextResponse.json({ error: 'Deck is exhausted' }, { status: 400 });
    }

    const nextCard = deck[nextIndex];
    const currentValue = getCardValue(currentCard);
    const nextValue = getCardValue(nextCard);

    // Mathematical probability based on remaining cards
    const remainingCards = deck.slice(currentIndex + 1);
    const totalRemaining = remainingCards.length;

    const higherCount = remainingCards.filter(c => getCardValue(c) > currentValue).length;
    const lowerCount = remainingCards.filter(c => getCardValue(c) < currentValue).length;
    const equalCount = remainingCards.filter(c => getCardValue(c) === currentValue).length;

    let isCorrect = false;
    let winCount = 0;

    if (guess === 'higher') {
      isCorrect = nextValue > currentValue;
      winCount = higherCount;
    } else if (guess === 'lower') {
      isCorrect = nextValue < currentValue;
      winCount = lowerCount;
    } else if (guess === 'equal') {
      isCorrect = nextValue === currentValue;
      winCount = equalCount;
    }

    let newMultiplier = round.currentMultiplier;
    let newStatus = round.status;

    if (isCorrect) {
      const stepMultiplier = winCount > 0 ? (totalRemaining / winCount) * 0.98 : 1.0;
      newMultiplier = Number((round.currentMultiplier * stepMultiplier).toFixed(4));
    } else {
      newStatus = 'busted';
      newMultiplier = 0;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true }
    })
    const newBalance = user ? Number(user.balance) : 0

    const updatedRound = await prisma.hiLoRound.updateMany({
      where: { id: roundId, userId, status: 'active' },
      data: {
        currentIndex: nextIndex,
        currentMultiplier: newMultiplier,
        status: newStatus,
      },
    });

    if (updatedRound.count !== 1) {
      return NextResponse.json({ error: 'Round is not active' }, { status: 400 });
    }

    // Prepare next card's multipliers if round is still active
    let nextMultipliers = { higher: 0, lower: 0, equal: 0 };
    if (newStatus === 'active' && nextIndex + 1 < deck.length) {
      const futureRemaining = deck.slice(nextIndex + 1);
      const futureTotal = futureRemaining.length;
      const nextCardValue = getCardValue(nextCard);

      const nextHigher = futureRemaining.filter(c => getCardValue(c) > nextCardValue).length;
      const nextLower = futureRemaining.filter(c => getCardValue(c) < nextCardValue).length;
      const nextEqual = futureRemaining.filter(c => getCardValue(c) === nextCardValue).length;

      nextMultipliers = {
        higher: nextHigher > 0 ? Number(((futureTotal / nextHigher) * 0.98).toFixed(2)) : 0,
        lower: nextLower > 0 ? Number(((futureTotal / nextLower) * 0.98).toFixed(2)) : 0,
        equal: nextEqual > 0 ? Number(((futureTotal / nextEqual) * 0.98).toFixed(2)) : 0,
      };
    }

    return NextResponse.json({
      success: true,
      nextCard,
      currentIndex: nextIndex,
      currentMultiplier: newMultiplier,
      nextMultipliers,
      isCorrect,
      status: newStatus,
      newBalance,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
