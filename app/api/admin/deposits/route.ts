import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { Prisma } from '@prisma/client';

export async function GET(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'ALL';

    const where: any = {};
    if (status !== 'ALL') where.status = status;

    const requests = await prisma.depositRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, email: true, balance: true } },
        paymentAccount: true
      }
    });

    const formatted = requests.map(r => ({
      ...r,
      amount: Number(r.amount),
      userBalance: Number(r.user.balance),
      paymentAccountDetails: r.paymentAccount ? JSON.parse(r.paymentAccount.details || '{}') : null
    }));

    return NextResponse.json(formatted);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const { requestId, action, adminNotes } = body; // action: 'APPROVE' | 'REJECT'

    if (!requestId || !action) {
      return NextResponse.json({ error: 'RequestId and action required' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.depositRequest.findUnique({
        where: { id: requestId },
        include: { user: true }
      });

      if (!request) throw new Error('Deposit request not found');
      if (request.status !== 'PENDING') throw new Error(`Deposit request already ${request.status.toLowerCase()}`);

      const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      const updated = await tx.depositRequest.update({
        where: { id: requestId },
        data: {
          status: newStatus,
          adminNotes: adminNotes || null,
          processedAt: new Date()
        }
      });

      if (action === 'APPROVE') {
        const depositAmount = request.amount;
        const balanceBefore = request.user.balance;
        const balanceAfter = new Prisma.Decimal(balanceBefore).add(depositAmount);

        await tx.user.update({
          where: { id: request.userId },
          data: {
            balance: { increment: depositAmount },
            totalDeposited: { increment: depositAmount }
          }
        });

        await tx.transaction.create({
          data: {
            userId: request.userId,
            type: 'DEPOSIT',
            amount: depositAmount,
            balanceBefore,
            balanceAfter,
            method: request.method,
            reference: request.transactionId || request.id,
            reason: `Manual Deposit Approved (Ref: ${request.transactionId || 'N/A'})`,
            status: 'completed',
            adminUserId: session!.user.id
          }
        });
      }

      await tx.adminLog.create({
        data: {
          adminId: session!.user.id,
          action: `DEPOSIT_${action}`,
          targetId: requestId,
          details: `Deposit ${action} for ₹${request.amount}. TX: ${request.transactionId || 'N/A'}`
        }
      });

      return updated;
    });

    return NextResponse.json({ success: true, request: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
