import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { generateSeed, hashSeed, hmacRandom } from '@/lib/provably-fair';
import { placeBet, settleBet } from '@/lib/wallet';
import crypto from 'crypto';

// Symbols
const SYMBOLS = {
  TIGER: '🐅', // Wild/High
  DRAGON: '🐉', // Scatter
  FROG: '🐸',
  TURTLE: '🐢',
  FISH: '🐟',
  A: 'A', K: 'K', Q: 'Q', J: 'J', T: '10', N: '9'
};

const SYMBOL_WEIGHTS = [
  { s: SYMBOLS.TIGER, w: 1 },
  { s: SYMBOLS.DRAGON, w: 2 },
  { s: SYMBOLS.FROG, w: 4 },
  { s: SYMBOLS.TURTLE, w: 5 },
  { s: SYMBOLS.FISH, w: 6 },
  { s: SYMBOLS.A, w: 12 },
  { s: SYMBOLS.K, w: 12 },
  { s: SYMBOLS.Q, w: 14 },
  { s: SYMBOLS.J, w: 14 },
  { s: SYMBOLS.T, w: 15 },
  { s: SYMBOLS.N, w: 15 },
];

const PAYOUTS: Record<string, Record<number, number>> = {
  [SYMBOLS.TIGER]: { 3: 5, 4: 20, 5: 100 },
  [SYMBOLS.FROG]: { 3: 2, 4: 10, 5: 50 },
  [SYMBOLS.TURTLE]: { 3: 1.5, 4: 5, 5: 25 },
  [SYMBOLS.FISH]: { 3: 1, 4: 3, 5: 15 },
  [SYMBOLS.A]: { 3: 0.5, 4: 2, 5: 10 },
  [SYMBOLS.K]: { 3: 0.5, 4: 2, 5: 10 },
  [SYMBOLS.Q]: { 3: 0.4, 4: 1.5, 5: 8 },
  [SYMBOLS.J]: { 3: 0.4, 4: 1.5, 5: 8 },
  [SYMBOLS.T]: { 3: 0.2, 4: 1, 5: 5 },
  [SYMBOLS.N]: { 3: 0.2, 4: 1, 5: 5 },
};

// 20 Standard Paylines (5x3 grid: rows 0,1,2. columns 0,1,2,3,4)
const PAYLINES = [
  [1,1,1,1,1], [0,0,0,0,0], [2,2,2,2,2], // Straight horizontals
  [0,1,2,1,0], [2,1,0,1,2], // V and inverted V
  [1,0,0,0,1], [1,2,2,2,1], // Trapezoids
  [0,0,1,2,2], [2,2,1,0,0], // Diagonal steps
  [1,2,1,0,1], [1,0,1,2,1], // Zig zags
  [0,1,1,1,0], [2,1,1,1,2], // Flat centers
  [0,1,0,1,0], [2,1,2,1,2], // Wavy
  [1,1,0,1,1], [1,1,2,1,1], // Top/Bottom peaks
  [0,0,2,0,0], [2,2,0,2,2], // Deep dips
  [0,2,0,2,0] // Alternating extreme
];

function getRandomSymbol(rand: number) {
  const totalWeight = SYMBOL_WEIGHTS.reduce((acc, curr) => acc + curr.w, 0);
  let r = rand * totalWeight;
  for (const item of SYMBOL_WEIGHTS) {
    r -= item.w;
    if (r <= 0) return item.s;
  }
  return SYMBOL_WEIGHTS[SYMBOL_WEIGHTS.length - 1].s;
}

export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const { betAmount } = await (req.json() as { betAmount: number });

    if (!betAmount || betAmount <= 0) {
      return NextResponse.json({ error: 'Invalid bet amount' }, { status: 400 });
    }

    // Deduct bet
    const walletRes = await placeBet(user.id, betAmount);
    if (!walletRes) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    const serverSeed = generateSeed();
    const serverSeedHash = hashSeed(serverSeed);
    const clientSeed = crypto.randomBytes(16).toString('hex');
    const nonce = 1n;

    // Generate 5x3 Grid (Col x Row for easier reading, but we store as 5 arrays of 3)
    const grid: string[][] = Array(5).fill([]).map(() => Array(3).fill(''));
    let scatterCount = 0;

    for (let c = 0; c < 5; c++) {
      for (let r = 0; r < 3; r++) {
         const rand = hmacRandom(serverSeed, clientSeed, Number(nonce), c * 10 + r);
         const sym = getRandomSymbol(rand);
         grid[c][r] = sym;
         if (sym === SYMBOLS.DRAGON) scatterCount++;
      }
    }

    // Calculate Paylines
    let totalMultiplier = 0;
    const winningLines = [];

    for (let i = 0; i < PAYLINES.length; i++) {
       const line = PAYLINES[i];
       // Check matching symbols left to right
       let matchCount = 1;
       const firstSym = grid[0][line[0]];
       
       if (firstSym === SYMBOLS.DRAGON) continue; // Scatter doesn't pay on lines

       for (let c = 1; c < 5; c++) {
          const sym = grid[c][line[c]];
          // Tiger is wild
          if (sym === firstSym || sym === SYMBOLS.TIGER || (firstSym === SYMBOLS.TIGER && sym !== SYMBOLS.DRAGON)) {
             matchCount++;
          } else {
             break;
          }
       }

       if (matchCount >= 3) {
          // Resolve actual symbol if first was wild
          let resolvedSym = firstSym;
          if (firstSym === SYMBOLS.TIGER) {
             for (let c = 1; c < matchCount; c++) {
               if (grid[c][line[c]] !== SYMBOLS.TIGER) {
                 resolvedSym = grid[c][line[c]];
                 break;
               }
             }
          }
          const mult = PAYOUTS[resolvedSym]?.[matchCount] || 0;
          if (mult > 0) {
             totalMultiplier += mult;
             winningLines.push({ lineIndex: i, symbol: resolvedSym, count: matchCount, multiplier: mult, path: line });
          }
       }
    }

    let freeSpinsAwarded = 0;
    if (scatterCount >= 3) {
       freeSpinsAwarded = 10;
       totalMultiplier += scatterCount; // Bonus scatter payout
    }

    const totalWin = betAmount * totalMultiplier;

    const round = await prisma.slotsRound.create({
      data: {
        userId: user.id,
        betAmount,
        totalWin,
        finalMultiplier: totalMultiplier,
        serverSeed,
        serverSeedHash,
        clientSeed,
        nonce,
      }
    });

    if (totalWin > 0) {
       await settleBet(user.id, totalWin, 'slots', round.id);
    }

    return NextResponse.json({
      roundId: round.id,
      grid,
      winningLines,
      totalWin,
      freeSpinsAwarded,
      serverSeedHash,
      serverSeed, // Revealed immediately since single spin
    });

  } catch (err: any) {
    console.error('Slots spin error:', err);
    return NextResponse.json({ error: 'Failed to process spin' }, { status: 500 });
  }
}
