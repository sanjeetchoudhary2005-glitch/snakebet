import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { generateSeed, hashSeed, hmacRandom } from '@/lib/provably-fair';
import { placeBet, creditPayout } from '@/lib/wallet';
import crypto from 'crypto';

const HOUSE_EDGE = 0.03; // 3%
const ANDAR_TRUE_PROB = 0.515;
const BAHAR_TRUE_PROB = 0.485;

// Apply house edge to true multipliers
const ANDAR_MULTIPLIER = (1 / ANDAR_TRUE_PROB) * (1 - HOUSE_EDGE); // ~ 1.88
const BAHAR_MULTIPLIER = (1 / BAHAR_TRUE_PROB) * (1 - HOUSE_EDGE); // ~ 2.00

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function generateShuffledDeck(serverSeed: string, clientSeed: string, nonce: number) {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }

  // Fisher-Yates shuffle
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
    const { betAmount, choice, clientSeed } = await (req.json() as { betAmount: number, choice: 'andar' | 'bahar', clientSeed: string });

    if (!betAmount || betAmount <= 0 || !['andar', 'bahar'].includes(choice)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const walletRes = await placeBet(user.id, betAmount);
    if (!walletRes) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    const serverSeed = generateSeed();
    const serverSeedHash = hashSeed(serverSeed);
    const nonce = Date.now();

    const deck = generateShuffledDeck(serverSeed, clientSeed, nonce);

    // Play the game
    const joker = deck[0];
    let winningSide: 'andar' | 'bahar' | null = null;
    let cardCount = 1; // Joker is 0
    let currentSide: 'andar' | 'bahar' = 'andar'; // First card goes to Andar

    const drawnCards = [];
    
    for (let i = 1; i < deck.length; i++) {
      const card = deck[i];
      drawnCards.push({ ...card, side: currentSide });
      cardCount++;
      
      if (card.rank === joker.rank) {
        winningSide = currentSide;
        break;
      }
      
      currentSide = currentSide === 'andar' ? 'bahar' : 'andar';
    }

    const won = winningSide === choice;
    const payoutMultiplier = choice === 'andar' ? ANDAR_MULTIPLIER : BAHAR_MULTIPLIER;
    const winAmount = won ? betAmount * payoutMultiplier : 0;

    const round = await prisma.andarBaharRound.create({
      data: {
        userId: user.id,
        betAmount,
        choice,
        result: winningSide!,
        won,
        payout: winAmount,
        serverSeed,
        serverSeedHash,
        clientSeed,
        nonce: BigInt(nonce),
      }
    });

    if (won) {
      await creditPayout(user.id, winAmount);
    }

    return NextResponse.json({
      roundId: round.id,
      serverSeedHash,
      joker,
      drawnCards,
      winningSide,
      won,
      payout: winAmount,
      multiplier: won ? payoutMultiplier : 0,
      serverSeed, // Send to client for instant verification since round is settled in one request
    });
  } catch (err: any) {
    console.error('Andar Bahar deal error:', err);
    return NextResponse.json({ error: 'Failed to process Andar Bahar' }, { status: 500 });
  }
}
