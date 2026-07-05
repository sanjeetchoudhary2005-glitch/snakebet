import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // 1. Total Users
    const totalUsers = await prisma.user.count({ where: { role: 'USER' } });

    // 2. Total Deposits Today
    const depositsTodayResult = await prisma.transaction.aggregate({
      where: {
        type: 'DEPOSIT',
        status: 'completed',
        createdAt: { gte: startOfToday }
      },
      _sum: { amount: true }
    });
    const totalDepositsToday = Number(depositsTodayResult._sum.amount || 0);

    // 3. Total Withdrawals Today
    const withdrawalsTodayResult = await prisma.transaction.aggregate({
      where: {
        type: 'WITHDRAWAL',
        status: 'completed',
        createdAt: { gte: startOfToday }
      },
      _sum: { amount: true }
    });
    const totalWithdrawalsToday = Number(withdrawalsTodayResult._sum.amount || 0);

    // 4. Net Profit Today (Bets placed today minus Winnings paid out today)
    const betsTodayResult = await prisma.transaction.aggregate({
      where: {
        type: 'BET',
        status: 'completed',
        createdAt: { gte: startOfToday }
      },
      _sum: { amount: true }
    });
    const winsTodayResult = await prisma.transaction.aggregate({
      where: {
        type: 'WIN',
        status: 'completed',
        createdAt: { gte: startOfToday }
      },
      _sum: { amount: true }
    });
    const netProfitToday = Number(betsTodayResult._sum.amount || 0) - Number(winsTodayResult._sum.amount || 0);

    // 5. Total Balance in Platform
    const totalBalanceResult = await prisma.user.aggregate({
      _sum: { balance: true }
    });
    const totalBalance = Number(totalBalanceResult._sum.balance || 0);

    // 6. Active Players Right Now (logged in or placed bet in last 15 mins)
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const activePlayers = await prisma.user.count({
      where: {
        lastLogin: { gte: fifteenMinsAgo }
      }
    });

    // 7. Last 7 days chart data per game (Crash, Mines, Dice)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
      const dateStr = dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Crash games
      const crashGames = await prisma.game.findMany({
        where: {
          type: 'CRASH',
          createdAt: { gte: dayStart, lte: dayEnd }
        }
      });
      let crashProfit = 0;
      crashGames.forEach(g => {
        crashProfit += (g.betAmount - g.winAmount);
      });

      // Mines games
      const minesGames = await prisma.game.findMany({
        where: {
          type: 'MINES',
          createdAt: { gte: dayStart, lte: dayEnd }
        }
      });
      let minesProfit = 0;
      minesGames.forEach(g => {
        minesProfit += (g.betAmount - g.winAmount);
      });

      // Dice games
      const diceGames = await prisma.game.findMany({
        where: {
          type: 'DICE',
          createdAt: { gte: dayStart, lte: dayEnd }
        }
      });
      let diceProfit = 0;
      diceGames.forEach(g => {
        diceProfit += (g.betAmount - g.winAmount);
      });

      // Teen Patti Rake
      const tpRakeResult = await prisma.houseRake.aggregate({
        where: {
          gameType: 'TEEN_PATTI',
          createdAt: { gte: dayStart, lte: dayEnd }
        },
        _sum: { amount: true }
      });
      const teenPattiRake = Number(tpRakeResult._sum.amount || 0);

      chartData.push({
        date: dateStr,
        Crash: Math.round(crashProfit),
        Mines: Math.round(minesProfit),
        Dice: Math.round(diceProfit),
        TeenPatti: Math.round(teenPattiRake),
        Total: Math.round(crashProfit + minesProfit + diceProfit + teenPattiRake)
      });
    }

    return NextResponse.json({
      stats: {
        totalUsers,
        totalDepositsToday,
        totalWithdrawalsToday,
        netProfitToday,
        totalBalance,
        activePlayers
      },
      chartData
    });
  } catch (error: any) {
    console.error('Admin dashboard stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
