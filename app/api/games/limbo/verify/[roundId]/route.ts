
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteParams = { params: Promise<{ roundId: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { roundId } = await params;
    const round = await prisma.limboRound.findUnique({
      where: { id: roundId },
    });

    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }

    return NextResponse.json({
      serverSeed: round.serverSeed,
      serverSeedHash: round.serverSeedHash,
      clientSeed: round.clientSeed,
      nonce: Number(round.nonce),
      resultMultiplier: round.resultMultiplier,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to get round' }, { status: 500 });
  }
}
