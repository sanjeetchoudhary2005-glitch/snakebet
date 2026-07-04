import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (!session?.user?.id || !['ADMIN', 'SUPER_ADMIN'].includes(role)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Admin access required' }, { status: 403 }),
    };
  }

  return {
    ok: true as const,
    userId: session.user.id,
    role,
  };
}
