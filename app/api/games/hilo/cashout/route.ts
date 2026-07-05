import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { settleBet } from '@/lib/wallet';

export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const { roundId } = await (req.json() as { roundId: string });

    if (!roundId) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const round = await prisma.hiLoRound.findUnique({ where: { id: roundId } });
    if (!round || round.userId !== user.id) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }

    if (round.status !== 'active') {
      return NextResponse.json({ error: 'Round is no longer active' }, { status: 400 });
    }

    if (round.currentIndex === 0) {
      return NextResponse.json({ error: 'Cannot cashout before playing' }, { status: 400 });
    }

    const winAmount = Number(round.betAmount) * round.currentMultiplier;

    await prisma.hiLoRound.update({
       where: { id: round.id },
       data: { status: "cashed_out" }
    });

    await settleBet(user.id, winAmount, 'hilo', round.id);

    return NextResponse.json({
       cashedOut: true,
       winAmount,
       serverSeed: round.serverSeed, // Reveal seed on end
    });

  } catch (err: any) {
    console.error('HiLo cashout error:', err);
    return NextResponse.json({ error: 'Failed to cashout' }, { status: 500 });
  }
}
