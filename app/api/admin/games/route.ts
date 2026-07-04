import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await verifySession(request);
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const settings = await prisma.gameSetting.findMany();
    return NextResponse.json({ settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await verifySession(request);
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { game, isActive } = await request.json();
    
    if (!game || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const updated = await prisma.$transaction([
      prisma.gameSetting.upsert({
        where: { game },
        update: { isActive },
        create: { game, isActive }
      }),
      prisma.adminLog.create({
        data: {
          adminId: session.userId as string,
          action: 'TOGGLE_GAME',
          targetId: game,
          details: JSON.stringify({ isActive })
        }
      })
    ]);

    return NextResponse.json({ success: true, setting: updated[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
