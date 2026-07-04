import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null };
  }
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    return { error: NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 }), session: null };
  }
  return { error: null, session };
}
