import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { generateSeed, hashSeed, hmacRandom } from '@/lib/provably-fair';
import { placeBet } from '@/lib/wallet';
import crypto from 'crypto';

const DIFFICULTY_CONFIG = {
  easy: { tilesPerRow: 4, trapsPerRow: 1 },
  medium: { tilesPerRow: 3, trapsPerRow: 1 },
  hard: { tilesPerRow: 2, trapsPerRow: 1 },
  expert: { tilesPerRow: 4, trapsPerRow: 3 },
};

export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const { betAmount, difficulty } = await (req.json() as { betAmount: number, difficulty: string });

    if (!betAmount || betAmount <= 0) {
      return NextResponse.json({ error: 'Invalid bet amount' }, { status: 400 });
    }

    const config = DIFFICULTY_CONFIG[difficulty as keyof typeof DIFFICULTY_CONFIG];
    if (!config) {
      return NextResponse.json({ error: 'Invalid difficulty' }, { status: 400 });
    }

    // Deduct bet amount
    const walletRes = await placeBet(user.id, betAmount);
    if (!walletRes) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    const serverSeed = generateSeed();
    const serverSeedHash = hashSeed(serverSeed);
    const clientSeed = crypto.randomBytes(16).toString('hex');
    const nonce = 1n; 

    // Generate 9 rows of traps
    const levelLayout = [];
    for (let row = 0; row < 9; row++) {
       const traps = [];
       const availableIndices = Array.from({ length: config.tilesPerRow }, (_, i) => i);
       
       for (let t = 0; t < config.trapsPerRow; t++) {
           // Provide a unique index string for hmacRandom per trap
           const rand = hmacRandom(serverSeed, clientSeed, Number(nonce), row * 10 + t);
           const pickedIndex = Math.floor(rand * availableIndices.length);
           traps.push(availableIndices.splice(pickedIndex, 1)[0]);
       }
       levelLayout.push(traps);
    }

    const round = await prisma.dragonTowerRound.create({
      data: {
        userId: user.id,
        betAmount,
        difficulty,
        levelLayout: JSON.stringify(levelLayout),
        currentLevel: 0,
        currentMultiplier: 1.0,
        status: "active",
        serverSeed,
        serverSeedHash,
        clientSeed,
        nonce,
      }
    });

    return NextResponse.json({
      roundId: round.id,
      serverSeedHash,
      rowCount: 9,
      difficulty,
    });
  } catch (err: any) {
    console.error('Dragon Tower start error:', err);
    return NextResponse.json({ error: 'Failed to start round' }, { status: 500 });
  }
}
