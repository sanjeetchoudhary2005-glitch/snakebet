import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';

const HOUSE_EDGE = 0.03; // 3%

export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const { roundId, choice } = await (req.json() as { roundId: string, choice: 'higher' | 'lower' | 'equal' });

    if (!roundId || !['higher', 'lower', 'equal'].includes(choice)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const round = await prisma.hiLoRound.findUnique({ where: { id: roundId } });
    if (!round || round.userId !== user.id) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }

    if (round.status !== 'active') {
      return NextResponse.json({ error: 'Round is no longer active' }, { status: 400 });
    }

    const deck = JSON.parse(round.deck) as { suit: string, rank: string, value: number }[];
    const currentIndex = round.currentIndex;
    const currentCard = deck[currentIndex];
    
    if (currentIndex + 1 >= deck.length) {
      return NextResponse.json({ error: 'Deck exhausted' }, { status: 400 });
    }

    const nextCard = deck[currentIndex + 1];
    
    // Calculate true odds based on remaining cards
    const remainingCards = deck.slice(currentIndex + 1);
    const totalRemaining = remainingCards.length;
    
    let higherCount = 0;
    let lowerCount = 0;
    let equalCount = 0;
    
    for (const card of remainingCards) {
      if (card.value > currentCard.value) higherCount++;
      else if (card.value < currentCard.value) lowerCount++;
      else equalCount++;
    }

    let isWin = false;
    let probability = 0;

    if (choice === 'higher') {
      isWin = nextCard.value > currentCard.value;
      probability = higherCount / totalRemaining;
    } else if (choice === 'lower') {
      isWin = nextCard.value < currentCard.value;
      probability = lowerCount / totalRemaining;
    } else if (choice === 'equal') {
      isWin = nextCard.value === currentCard.value;
      probability = equalCount / totalRemaining;
    }

    if (probability === 0) probability = 0.0001; // Avoid divide by zero for extreme edge cases

    if (!isWin) {
      await prisma.hiLoRound.update({
        where: { id: round.id },
        data: { status: "busted", currentIndex: currentIndex + 1 }
      });
      return NextResponse.json({
        win: false,
        card: nextCard,
        status: "busted",
        serverSeed: round.serverSeed,
      });
    }

    // Win! Calculate multiplier
    const trueMultiplier = 1 / probability;
    const stepMultiplier = trueMultiplier * (1 - HOUSE_EDGE);
    const newMultiplier = round.currentMultiplier * stepMultiplier;

    await prisma.hiLoRound.update({
      where: { id: round.id },
      data: {
        currentIndex: currentIndex + 1,
        currentMultiplier: newMultiplier,
      }
    });

    return NextResponse.json({
      win: true,
      card: nextCard,
      currentMultiplier: newMultiplier,
      status: "active",
    });

  } catch (err: any) {
    console.error('HiLo action error:', err);
    return NextResponse.json({ error: 'Failed to process HiLo action' }, { status: 500 });
  }
}
