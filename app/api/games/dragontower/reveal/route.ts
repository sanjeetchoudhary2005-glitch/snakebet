import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDragonTowerMultiplier } from '@/lib/provably-fair';
import { auth } from '@/auth';
import { z } from 'zod';
import { isNextResponse, parseJson } from '@/lib/api';

const revealSchema = z.object({
  roundId: z.string().min(1),
  tileIndex: z.number().int().min(0).max(3),
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

    const round = await prisma.dragonTowerRound.findUnique({
      where: { id: roundId },
    });

    if (!round || round.userId !== userId) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }

    if (round.status !== 'active') {
      return NextResponse.json({ error: 'Round is not active' }, { status: 400 });
    }

    const layout = JSON.parse(round.levelLayout);
    const currentLevelLayout = layout[round.currentLevel];

    if (!currentLevelLayout) {
      return NextResponse.json({ error: 'Level not found' }, { status: 400 });
    }

    const isTrap = currentLevelLayout.trapPositions.includes(tileIndex);

    if (isTrap) {
      await prisma.dragonTowerRound.updateMany({
        where: { id: roundId, userId, status: 'active' },
        data: {
          status: 'busted',
        },
      });

      return NextResponse.json({
        success: true,
        isTrap: true,
        gameOver: true,
      });
    }

    const newLevel = round.currentLevel + 1;
    const newMultiplier = getDragonTowerMultiplier(round.difficulty, newLevel);
    let newStatus = 'active';
    let nextLevelLayout = null;

    if (newLevel >= layout.length) {
      newStatus = 'won';
    } else {
      nextLevelLayout = layout[newLevel];
    }

    await prisma.dragonTowerRound.updateMany({
      where: { id: roundId, userId, status: 'active' },
      data: {
        currentLevel: newLevel,
        currentMultiplier: newMultiplier,
        status: newStatus,
      },
    });

    return NextResponse.json({
      success: true,
      isTrap: false,
      currentLevel: newLevel,
      currentMultiplier: newMultiplier,
      status: newStatus,
      nextLevelLayout,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
