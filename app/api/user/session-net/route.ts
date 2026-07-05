import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ net: 0, since: null });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { lastLogin: true },
  });
  const since = user?.lastLogin ?? new Date(Date.now() - 24 * 60 * 60 * 1000);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: session.user.id,
      createdAt: { gte: since },
      type: { in: ['BET', 'WIN'] },
    },
    select: { type: true, amount: true },
  });

  const net = transactions.reduce((sum, transaction) => {
    const amount = Number(transaction.amount);
    return transaction.type === 'WIN' ? sum + amount : sum - amount;
  }, 0);

  return NextResponse.json({ net, since });
}
