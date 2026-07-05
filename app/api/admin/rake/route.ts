import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await verifySession(request);
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // In a real app we'd aggregate over time. For now, mock based on prompt request.
    const rakeByGame = await prisma.houseRake.groupBy({
      by: ['gameType'],
      _sum: { amount: true },
    });

    const totalRake = rakeByGame.reduce((acc, curr) => acc + Number(curr._sum.amount || 0), 0);
    const projectedMonthly = totalRake > 0 ? totalRake * 4.3 : 150000; // Mock projection if low data

    return NextResponse.json({ 
      rakeByGame, 
      totalRake,
      projectedMonthly
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
