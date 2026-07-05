import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// Define reward amounts for each streak day (1-7)
const streakRewards = [10, 25, 50, 100, 200, 350, 500];

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { userDailyRewards: { orderBy: { claimedAt: 'desc' }, take: 1 } },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastRewardDate = user.lastDailyReward
      ? new Date(
          user.lastDailyReward.getFullYear(),
          user.lastDailyReward.getMonth(),
          user.lastDailyReward.getDate()
        )
      : null;

    const canClaim = !lastRewardDate || lastRewardDate < today;
    const nextStreakDay = Math.min(user.dailyStreak + 1, 7);
    const nextReward = canClaim ? streakRewards[nextStreakDay - 1] : 0;

    return NextResponse.json({
      canClaim,
      currentStreak: user.dailyStreak,
      nextReward,
      lastClaimed: user.lastDailyReward,
    });
  } catch (error) {
    console.error('Daily reward get error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastRewardDate = user.lastDailyReward
      ? new Date(
          user.lastDailyReward.getFullYear(),
          user.lastDailyReward.getMonth(),
          user.lastDailyReward.getDate()
        )
      : null;

    if (lastRewardDate && lastRewardDate >= today) {
      return NextResponse.json(
        { error: 'Reward already claimed today' },
        { status: 400 }
      );
    }

    // Calculate new streak
    let newStreak = user.dailyStreak;
    if (lastRewardDate) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastRewardDate.getTime() === yesterday.getTime()) {
        newStreak = Math.min(user.dailyStreak + 1, 7);
      } else {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    const rewardAmount = streakRewards[newStreak - 1];

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get user's current balance first
      const userBefore = await tx.user.findUnique({ where: { id: userId } });
      if (!userBefore) throw new Error('User not found');

      const balanceBefore = userBefore.balance;
      const balanceAfter = balanceBefore.toNumber() + rewardAmount;

      // Update user
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          balance: { increment: rewardAmount },
          dailyStreak: newStreak,
          lastDailyReward: now,
        },
      });

      // Create reward record
      const reward = await tx.userDailyReward.create({
        data: {
          userId: userId,
          amount: rewardAmount,
          day: newStreak,
          claimedAt: now,
        },
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId: userId,
          amount: rewardAmount,
          type: 'DEPOSIT',
          status: 'COMPLETED',
          method: 'DAILY_REWARD',
          reference: reward.id,
          balanceBefore,
          balanceAfter,
        },
      });

      return { user: updatedUser, reward, transaction };
    });

    return NextResponse.json({
      success: true,
      reward: result.reward,
      newStreak: result.user.dailyStreak,
      newBalance: result.user.balance,
    });
  } catch (error) {
    console.error('Daily reward claim error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
