import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { generateSeed, hashSeed, hmacRandom } from '@/lib/provably-fair';
import { placeBet } from '@/lib/wallet';
import crypto from 'crypto';

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const RANK_VALUES = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

function generateShuffledDeck(serverSeed: string, clientSeed: string, nonce: number) {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, value: RANK_VALUES[rank as keyof typeof RANK_VALUES] });
    }
  }

  // Fisher-Yates shuffle using hmacRandom
  for (let i = deck.length - 1; i > 0; i--) {
    const rand = hmacRandom(serverSeed, clientSeed, nonce, i);
    const j = Math.floor(rand * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const { betAmount } = await (req.json() as { betAmount: number });

    if (!betAmount || betAmount <= 0) {
      return NextResponse.json({ error: 'Invalid bet amount' }, { status: 400 });
    }

    const walletRes = await placeBet(user.id, betAmount);
    if (!walletRes) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    const serverSeed = generateSeed();
    const serverSeedHash = hashSeed(serverSeed);
    const clientSeed = crypto.randomBytes(16).toString('hex');
    const nonce = Date.now();

    const deck = generateShuffledDeck(serverSeed, clientSeed, nonce);

    const round = await prisma.hiLoRound.create({
      data: {
        userId: user.id,
        betAmount,
        deck: JSON.stringify(deck),
        currentIndex: 0,
        currentMultiplier: 1.0,
        status: "active",
        serverSeed,
        serverSeedHash,
        clientSeed,
        nonce: BigInt(nonce),
      }
    });

    return NextResponse.json({
      roundId: round.id,
      serverSeedHash,
      startCard: deck[0],
      currentMultiplier: 1.0,
    });
  } catch (err: any) {
    console.error('HiLo start error:', err);
    return NextResponse.json({ error: 'Failed to start HiLo round' }, { status: 500 });
  }
}
