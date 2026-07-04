import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getVipStatus } from '@/lib/vip';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const status = await getVipStatus(session.user.id);
    return NextResponse.json(status);
  } catch (error) {
    console.error('VIP status error:', error);
    return NextResponse.json({ error: 'Failed to load VIP status' }, { status: 500 });
  }
}
