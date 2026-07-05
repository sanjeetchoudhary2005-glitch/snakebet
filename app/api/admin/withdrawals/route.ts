import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { Prisma } from '@prisma/client';

export async function GET(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'ALL'; // ALL | PENDING | APPROVED | REJECTED | ON_HOLD

    const where: any = {};
    if (status !== 'ALL') {
      if (status === 'APPROVED') {
        where.status = { in: ['APPROVED', 'COMPLETED'] };
      } else {
        where.status = status;
      }
    }

    const requests = await prisma.withdrawRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, username: true, email: true, balance: true }
        }
      }
    });

    // Calculate total pending amount
    const pendingAgg = await prisma.withdrawRequest.aggregate({
      where: { status: 'PENDING' },
      _sum: { amount: true }
    });
    const totalPendingAmount = Number(pendingAgg._sum.amount || 0);

    const formatted = requests.map(r => ({
      ...r,
      userBalance: Number(r.user.balance),
      accountDetails: r.accountDetails ? JSON.parse(r.accountDetails) : {}
    }));

    return NextResponse.json({
      requests: formatted,
      totalPendingAmount
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const { requestId, action, adminNotes } = body; // action: 'APPROVE' | 'REJECT' | 'HOLD'

    if (!requestId || !action) {
      return NextResponse.json({ error: 'RequestId and action required' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.withdrawRequest.findUnique({
        where: { id: requestId },
        include: { user: { select: { balance: true } } }
      });

      if (!request) throw new Error('Withdrawal request not found');

      let newStatus = request.status;
      if (action === 'APPROVE') newStatus = 'APPROVED';
      else if (action === 'REJECT') newStatus = 'REJECTED';
      else if (action === 'HOLD') newStatus = 'ON_HOLD';

      const updated = await tx.withdrawRequest.update({
        where: { id: requestId },
        data: {
          status: newStatus,
          adminNotes: adminNotes || null,
          processedAt: new Date()
        }
      });

      // If rejected, refund balance to user
      if (action === 'REJECT' && request.status !== 'REJECTED') {
        const amount = new Prisma.Decimal(request.amount);
        const updatedUser = await tx.user.update({
          where: { id: request.userId },
          data: { balance: { increment: amount } },
          select: { balance: true }
        });

        await tx.transaction.create({
          data: {
            userId: request.userId,
            type: 'WITHDRAWAL_REVERSAL',
            amount,
            balanceBefore: request.user.balance,
            balanceAfter: updatedUser.balance,
            method: 'ADMIN',
            reference: request.id,
            reason: `Withdrawal rejected: ${adminNotes || 'No notes'}`,
            adminUserId: session!.user.id
          }
        });
      }

      await tx.adminLog.create({
        data: {
          adminId: session!.user.id,
          action: `WITHDRAWAL_${action}`,
          targetId: requestId,
          details: `Withdrawal ${action} for ₹${request.amount}. Notes: ${adminNotes || 'None'}`
        }
      });

      return updated;
    });

    return NextResponse.json({ success: true, request: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
