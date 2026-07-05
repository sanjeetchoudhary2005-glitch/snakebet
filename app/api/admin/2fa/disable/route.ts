import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logSecurityEvent } from '@/lib/audit';
import { requireAdmin } from '@/lib/admin';

export async function POST() {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    await prisma.user.update({
      where: { id: admin.userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    await logSecurityEvent('2FA_DISABLED', admin.userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json({ error: 'Failed to disable 2FA' }, { status: 500 });
  }
}
