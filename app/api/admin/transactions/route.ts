import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await verifySession(request);
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 100;

  try {
    const where = type ? { type } : {};

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        user: {
          select: { username: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.transaction.count({ where });

    return NextResponse.json({ transactions, total, pages: Math.ceil(total / limit) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
