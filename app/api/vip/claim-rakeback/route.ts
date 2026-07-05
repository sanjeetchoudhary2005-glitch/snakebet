import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { claimVipRakeback } from '@/lib/vip';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await claimVipRakeback(session.user.id);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to claim rakeback';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
