import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await verifySession(request);
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { isActive } = await request.json();
    const id = params.id;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive must be a boolean' }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: { isActive }
      }),
      prisma.adminLog.create({
        data: {
          adminId: session.userId as string,
          action: isActive ? 'RESTORE_USER' : 'SUSPEND_USER',
          targetId: id,
          details: JSON.stringify({ isActive })
        }
      })
    ]);

    return NextResponse.json({ success: true, isActive });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
  }
}
