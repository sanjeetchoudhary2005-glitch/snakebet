import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { touchUserActive } from '@/lib/live-activity';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    await touchUserActive(session.user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Active ping error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
