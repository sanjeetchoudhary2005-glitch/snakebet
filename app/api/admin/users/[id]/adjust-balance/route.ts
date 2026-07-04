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
    const { amount, reason } = await request.json();
    const id = params.id;

    if (!amount || !reason) {
      return NextResponse.json({ error: 'Amount and reason are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const numAmount = Number(amount);

    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: { balance: { increment: numAmount } }
      }),
      prisma.transaction.create({
        data: {
          userId: id,
          type: 'ADMIN_ADJUSTMENT',
          amount: numAmount,
          balanceBefore: user.balance,
          balanceAfter: Number(user.balance) + numAmount,
          reason: reason, // Changed from 'notes' to 'reason' based on schema
          adminUserId: session.userId,
        }
      }),
      prisma.adminLog.create({
        data: {
          adminId: session.userId as string,
          action: 'BALANCE_ADJUST',
          targetId: id,
          details: JSON.stringify({ amount: numAmount, reason, balanceBefore: user.balance })
        }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to adjust balance' }, { status: 500 });
  }
}
