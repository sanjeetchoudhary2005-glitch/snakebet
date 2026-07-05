import { NextResponse } from 'next/server';
import { getLeaderboard, getUserLeaderboardRank, LeaderboardPeriod } from '@/lib/leaderboards';
import { auth } from '@/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const period = (searchParams.get('period') || 'weekly') as LeaderboardPeriod;
    const page = Number(searchParams.get('page') || 1);
    const limit = Number(searchParams.get('limit') || 20);

    if (!['today', 'weekly', 'alltime'].includes(period)) {
      return NextResponse.json({ error: 'Invalid period' }, { status: 400 });
    }

    const data = await getLeaderboard({ period, page, limit });

    const session = await auth();
    let currentUser = null;
    if (session?.user?.id) {
      currentUser = await getUserLeaderboardRank(session.user.id, period);
    }

    return NextResponse.json({ ...data, currentUser });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Failed to load leaderboard' }, { status: 500 });
  }
}
