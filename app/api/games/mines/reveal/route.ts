
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateMultiplier } from '@/lib/provably-fair';
import { auth } from '@/auth';
import { z } from 'zod';
import { isNextResponse, parseJson } from '@/lib/api';

const revealSchema = z.object({
  roundId: z.string().min(1),
  tileIndex: z.number().int().min(0).max(24),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const parsed = await parseJson(req, revealSchema);
    if (isNextResponse(parsed)) return parsed;
    const { roundId, tileIndex } = parsed;

    const round = await prisma.minesRound.findUnique({
      where: { id: roundId },
    });

    if (!round || round.userId !== userId) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }

    if (round.status !== 'active') {
      return NextResponse.json({ error: 'Round already ended' }, { status: 400 });
    }

    const revealedTiles = JSON.parse(round.revealedTiles);
    if (revealedTiles.includes(tileIndex)) {
      return NextResponse.json({ error: 'Tile already revealed' }, { status: 400 });
    }

    const minePositions = JSON.parse(round.minePositions);
    const isMine = minePositions.includes(tileIndex);

    const newRevealed = [...revealedTiles, tileIndex];
    let newMultiplier = 1.0;
    let newStatus = 'active';

    if (isMine) {
      newStatus = 'busted';
    } else {
      newMultiplier = calculateMultiplier(newRevealed.length, round.mineCount);
      if (newRevealed.length === 25 - round.mineCount) {
        // Max safe tiles revealed - auto cashout
        newStatus = 'cashed_out';
      }
    }

    const updated = await prisma.minesRound.updateMany({
      where: { id: roundId, userId, status: 'active' },
      data: {
        revealedTiles: JSON.stringify(newRevealed),
        currentMultiplier: newMultiplier,
        status: newStatus,
      },
    });
    if (updated.count !== 1) {
      return NextResponse.json({ error: 'Round already ended' }, { status: 400 });
    }

    return NextResponse.json({
      isMine,
      mine: isMine ? tileIndex : null,
      minePositions: isMine ? minePositions : null,
      currentMultiplier: newMultiplier,
      status: newStatus,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to reveal tile' }, { status: 500 });
  }
}
