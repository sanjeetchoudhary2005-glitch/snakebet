import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';

export async function GET(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get aggregated stats by grouping transactions or reading from GameStats (we'll aggregate transactions for real-time accuracy here)
    const games = ['coinflip', 'wheel', 'hilo', 'andar-bahar', 'dice', 'plinko'];
    
    // Instead of querying millions of rows, we query GameStats, and for today we query Transactions
    const stats = await prisma.gameStats.findMany({
      orderBy: { date: 'desc' },
      take: 50,
    });

    const activeSessions = await prisma.playerSession.count({
      where: { sessionEnd: null }
    });

    // We can also fetch the actual House Edge configured in DB
    const settings = await prisma.gameSetting.findMany();

    return NextResponse.json({
      stats,
      activeSessions,
      settings,
    });
  } catch (err: any) {
    console.error('Analytics error:', err);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
