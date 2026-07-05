import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashSeed } from '@/lib/provably-fair';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ roundId: string }> }
) {
  try {
    const { roundId } = await params;

    const round = await prisma.dragonTigerRound.findUnique({
      where: { id: roundId },
    });

    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }

    return NextResponse.json({
      roundId: round.id,
      serverSeed: round.serverSeed,
      serverSeedHash: round.serverSeedHash,
      clientSeed: round.clientSeed,
      nonce: Number(round.nonce),
      dragonCard: JSON.parse(round.dragonCard),
      tigerCard: JSON.parse(round.tigerCard),
      winner: round.winner,
      multiplier: round.multiplier,
      payout: Number(round.betAmount) * round.multiplier,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
