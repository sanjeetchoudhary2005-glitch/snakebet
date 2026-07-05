import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';

export async function GET(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 1000, // Export last 1000 for demo
      include: { user: { select: { username: true } } }
    });

    const headers = ['ID', 'Date', 'Type', 'Amount', 'Status', 'User', 'Game'];
    const rows = transactions.map(t => [
      t.id,
      t.createdAt.toISOString(),
      t.type,
      t.amount.toString(),
      t.status,
      t.user.username,
      t.gameId || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="transactions.csv"',
      }
    });

  } catch (err: any) {
    console.error('Export error:', err);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}
