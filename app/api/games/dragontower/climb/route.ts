import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';

const DIFFICULTY_CONFIG = {
  easy: { tilesPerRow: 4, safeTiles: 3 },
  medium: { tilesPerRow: 3, safeTiles: 2 },
  hard: { tilesPerRow: 2, safeTiles: 1 },
  expert: { tilesPerRow: 4, safeTiles: 1 },
};

export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const { roundId, row, tileIndex } = await (req.json() as { roundId: string, row: number, tileIndex: number });

    if (!roundId || row === undefined || tileIndex === undefined) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const round = await prisma.dragonTowerRound.findUnique({ where: { id: roundId } });
    if (!round || round.userId !== user.id) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }

    if (round.status !== 'active') {
      return NextResponse.json({ error: 'Round is no longer active' }, { status: 400 });
    }

    if (row !== round.currentLevel) {
      return NextResponse.json({ error: 'Invalid row selection' }, { status: 400 });
    }

    const config = DIFFICULTY_CONFIG[round.difficulty as keyof typeof DIFFICULTY_CONFIG];
    const levelLayout = JSON.parse(round.levelLayout) as number[][];
    
    const trapsInRow = levelLayout[row];
    const isBust = trapsInRow.includes(tileIndex);

    if (isBust) {
       // Player hit a trap
       await prisma.dragonTowerRound.update({
         where: { id: round.id },
         data: { status: "busted" }
       });

       return NextResponse.json({
         safe: false,
         revealedTraps: levelLayout, // Reveal everything on bust
       });
    }

    // Safe! Update multiplier and level
    const newLevel = round.currentLevel + 1;
    // Multiplier calculation
    const baseMult = Math.pow(config.tilesPerRow / config.safeTiles, newLevel);
    const newMultiplier = baseMult * 0.99; // 1% house edge

    const updatedRound = await prisma.dragonTowerRound.update({
       where: { id: round.id },
       data: {
          currentLevel: newLevel,
          currentMultiplier: newMultiplier,
       }
    });

    return NextResponse.json({
       safe: true,
       multiplier: newMultiplier,
       currentLevel: newLevel,
       revealedTrapsInRow: trapsInRow, // Show where the trap was in the cleared row
    });

  } catch (err: any) {
    console.error('Dragon Tower climb error:', err);
    return NextResponse.json({ error: 'Failed to process pick' }, { status: 500 });
  }
}
