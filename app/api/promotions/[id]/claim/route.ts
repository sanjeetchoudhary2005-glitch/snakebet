import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { claimPromotion } from '@/lib/promotions-user';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_req: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const result = await claimPromotion(session.user.id, id);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to claim promotion';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
