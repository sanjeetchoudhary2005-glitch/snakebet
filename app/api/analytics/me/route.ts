import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserAnalytics, AnalyticsRange } from '@/lib/analytics';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = (searchParams.get('range') || '30d') as AnalyticsRange;
    if (!['7d', '30d', '90d', 'all'].includes(range)) {
      return NextResponse.json({ error: 'Invalid range' }, { status: 400 });
    }

    const data = await getUserAnalytics(session.user.id, range);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 });
  }
}
