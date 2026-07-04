import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  // Validate cron secret if deployed to Vercel
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    // Group transactions to calculate stats
    // Note: Since Prisma doesn't natively group multiple disparate tables easily without raw SQL,
    // we aggregate the `Transaction` table looking for bets/payouts by gameId.
    const bets = await prisma.transaction.groupBy({
      by: ['gameId'],
      where: {
        type: 'BET',
        createdAt: { gte: yesterday, lte: endOfYesterday },
        gameId: { not: null }
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    const payouts = await prisma.transaction.groupBy({
      by: ['gameId'],
      where: {
        type: 'PAYOUT',
        createdAt: { gte: yesterday, lte: endOfYesterday },
        gameId: { not: null }
      },
      _sum: { amount: true },
    });

    for (const bet of bets) {
      if (!bet.gameId) continue;
      
      const payoutForGame = payouts.find(p => p.gameId === bet.gameId)?._sum.amount || 0;
      const totalWagered = Number(bet._sum.amount || 0);
      const totalPaidOut = Number(payoutForGame);
      const houseProfit = totalWagered - totalPaidOut;
      const actualRTP = totalWagered > 0 ? (totalPaidOut / totalWagered) * 100 : 0;

      await prisma.gameStats.upsert({
        where: {
          game_date: {
            game: bet.gameId,
            date: yesterday,
          }
        },
        update: {
          totalBets: bet._count.id,
          totalWagered,
          totalPaidOut,
          houseProfit,
          actualRTP,
        },
        create: {
          game: bet.gameId,
          date: yesterday,
          totalBets: bet._count.id,
          totalWagered,
          totalPaidOut,
          houseProfit,
          actualRTP,
        }
      });
    }

    return NextResponse.json({ success: true, aggregatedDate: yesterday });
  } catch (error) {
    console.error('Failed to aggregate stats:', error);
    return NextResponse.json({ error: 'Failed to aggregate stats' }, { status: 500 });
  }
}
