import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { logSecurityEvent } from '@/lib/audit';

function timingSafeEqualHex(a: string, b: string) {
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const bodyText = await req.text();
  const signature = req.headers.get('x-razorpay-signature');
  const eventId =
    req.headers.get('x-razorpay-event-id') ||
    crypto.createHash('sha256').update(bodyText).digest('hex');

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(bodyText).digest('hex');

  if (!timingSafeEqualHex(signature, expectedSignature)) {
    await logSecurityEvent(
      'INVALID_WEBHOOK_SIGNATURE',
      null,
      { signature, expected: expectedSignature, body: bodyText.slice(0, 100) },
      req
    );
    return new NextResponse('Invalid signature', { status: 401 });
  }

  let event: { event?: string; payload?: any };
  try {
    event = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  try {
    const existing = await prisma.razorpayWebhookEvent.findUnique({ where: { eventId } });
    if (existing) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    await prisma.razorpayWebhookEvent.create({
      data: {
        eventId,
        eventType: event.event || 'unknown',
        payload: bodyText,
        status: 'pending',
      },
    });

    if (event.event === 'payment.captured') {
      const { order_id, id: paymentId, amount } = event.payload.payment.entity;
      const transaction = await prisma.$transaction(async (tx) => {
        const pending = await tx.transaction.findFirst({
          where: { reference: order_id, type: 'DEPOSIT' },
          orderBy: { createdAt: 'desc' },
        });
        if (!pending) return null;
        if (pending.status === 'COMPLETED') return pending;

        const user = await tx.user.findUnique({
          where: { id: pending.userId },
          select: { balance: true },
        });
        if (!user) throw new Error('User not found');

        const amountRs = amount / 100;
        const updatedUser = await tx.user.update({
          where: { id: pending.userId },
          data: {
            balance: { increment: amountRs },
            totalDeposited: { increment: amountRs },
          },
          select: { balance: true },
        });

        return tx.transaction.update({
          where: { id: pending.id },
          data: {
            amount: amountRs,
            status: 'COMPLETED',
            reason: paymentId,
            balanceBefore: user.balance,
            balanceAfter: updatedUser.balance,
          },
        });
      });

      if (transaction) {
        await logSecurityEvent(
          'PAYMENT',
          transaction.userId,
          { type: 'deposit', amount: amount / 100, orderId: order_id, paymentId },
          req
        );
      }
    }

    if (event.event === 'payment.failed') {
      const { order_id, id: paymentId, error_description } = event.payload.payment.entity;
      await prisma.transaction.updateMany({
        where: { reference: order_id, type: 'DEPOSIT', status: { not: 'COMPLETED' } },
        data: { status: 'FAILED', reason: paymentId || error_description || 'payment.failed' },
      });
    }

    await prisma.razorpayWebhookEvent.update({
      where: { eventId },
      data: { status: 'processed' },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process webhook';
    console.error('Webhook processing error:', { eventId, error });

    await prisma.razorpayWebhookEvent
      .update({
        where: { eventId },
        data: { status: 'failed', error: message },
      })
      .catch(() => undefined);

    return NextResponse.json({ error: message, eventId }, { status: 500 });
  }
}
