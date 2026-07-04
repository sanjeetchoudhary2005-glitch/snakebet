import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { generateSeed, hashSeed, hmacRandom } from '@/lib/provably-fair';
import { placeBet, settleBet } from '@/lib/wallet';
import crypto from 'crypto';

interface RouletteBet {
  type: string;
  numbers: number[];
  amount: number;
}

const PAYOUT_MULTIPLIERS: Record<string, number> = {
  'straight': 36,
  'split': 18,
  'street': 12,
  'corner': 9,
  'line': 6,
  'dozen': 3,
  'column': 3,
  'red': 2,
  'black': 2,
  'odd': 2,
  'even': 2,
  'low': 2,
  'high': 2
};

export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const { bets, clientSeed } = await (req.json() as { bets: RouletteBet[], clientSeed: string });

    if (!bets || bets.length === 0) {
      return NextResponse.json({ error: 'No bets placed' }, { status: 400 });
    }

    const totalBetAmount = bets.reduce((sum, bet) => sum + bet.amount, 0);

    if (totalBetAmount <= 0) {
      return NextResponse.json({ error: 'Invalid bet amount' }, { status: 400 });
    }

    // Deduct bet amount
    const walletRes = await placeBet(user.id, totalBetAmount);
    if (!walletRes) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    const serverSeed = generateSeed();
    const serverSeedHash = hashSeed(serverSeed);
    const nonce = 1n; 

    // Generate winning number 0-36
    const rand = hmacRandom(serverSeed, clientSeed, Number(nonce), 0);
    const result = Math.floor(rand * 37);

    // Calculate payouts
    let totalPayout = 0;
    const payouts: any[] = [];

    const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
    const BLACK_NUMBERS = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];

    for (const bet of bets) {
       let won = false;
       if (bet.type === 'straight' && bet.numbers.includes(result)) won = true;
       if (bet.type === 'split' && bet.numbers.includes(result)) won = true;
       if (bet.type === 'street' && bet.numbers.includes(result)) won = true;
       if (bet.type === 'corner' && bet.numbers.includes(result)) won = true;
       if (bet.type === 'dozen' && bet.numbers.includes(result)) won = true;
       if (bet.type === 'column' && bet.numbers.includes(result)) won = true;
       
       if (bet.type === 'red' && RED_NUMBERS.includes(result)) won = true;
       if (bet.type === 'black' && BLACK_NUMBERS.includes(result)) won = true;
       
       if (result !== 0) {
          if (bet.type === 'odd' && result % 2 !== 0) won = true;
          if (bet.type === 'even' && result % 2 === 0) won = true;
          if (bet.type === 'low' && result >= 1 && result <= 18) won = true;
          if (bet.type === 'high' && result >= 19 && result <= 36) won = true;
       }

       if (won) {
         const multiplier = PAYOUT_MULTIPLIERS[bet.type] || 0;
         const winAmount = bet.amount * multiplier;
         totalPayout += winAmount;
         payouts.push({ type: bet.type, winAmount });
       }
    }

    const round = await prisma.rouletteRound.create({
      data: {
        userId: user.id,
        betAmount: totalBetAmount,
        bets: JSON.stringify(bets),
        result: result,
        payout: totalPayout,
        serverSeed,
        serverSeedHash,
        clientSeed,
        nonce,
      }
    });

    if (totalPayout > 0) {
       await settleBet(user.id, totalPayout, 'roulette', round.id);
    }

    return NextResponse.json({
      roundId: round.id,
      result,
      payouts,
      totalPayout,
      serverSeedHash,
      serverSeed, // Revealed immediately for Roulette since it's single-spin
    });
  } catch (err: any) {
    console.error('Roulette spin error:', err);
    return NextResponse.json({ error: 'Failed to process spin' }, { status: 500 });
  }
}
