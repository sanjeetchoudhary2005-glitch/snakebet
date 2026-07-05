import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { z } from 'zod';
import { isNextResponse, parseJson } from '@/lib/api';

const depositSubmitSchema = z.object({
  paymentAccountId: z.string().min(1),
  amount: z.number().positive().min(10),
  transactionId: z.string().min(3),
  screenshotUrl: z.string().optional().nullable()
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = await parseJson(req, depositSubmitSchema);
    if (isNextResponse(parsed)) return parsed;
    const { paymentAccountId, amount, transactionId, screenshotUrl } = parsed;

    const account = await prisma.paymentAccount.findUnique({
      where: { id: paymentAccountId }
    });

    if (!account || !account.isActive) {
      return NextResponse.json({ error: 'Invalid or inactive payment account' }, { status: 400 });
    }

    const depositRequest = await prisma.depositRequest.create({
      data: {
        userId: session.user.id,
        paymentAccountId,
        amount,
        method: account.type,
        transactionId,
        screenshotUrl: screenshotUrl || null,
        status: 'PENDING'
      }
    });

    return NextResponse.json({ success: true, depositRequest });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
