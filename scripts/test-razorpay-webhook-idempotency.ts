/**
 * Verifies Razorpay webhook idempotency using duplicate event IDs.
 * Run: DATABASE_URL=postgresql://... tsx scripts/test-razorpay-webhook-idempotency.ts
 */
import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

async function main() {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret';
  process.env.RAZORPAY_WEBHOOK_SECRET = secret;

  const suffix = Date.now();
  const user = await prisma.user.create({
    data: {
      email: `webhook-${suffix}@example.test`,
      username: `wh_${suffix}`,
      referralCode: `WH_${suffix}`,
      isVerified: true,
      balance: new Prisma.Decimal(0),
    },
  });

  const orderId = `order_${suffix}`;
  await prisma.transaction.create({
    data: {
      userId: user.id,
      amount: 200,
      type: 'DEPOSIT',
      status: 'PENDING',
      method: 'CARD',
      reference: orderId,
      balanceBefore: 0,
      balanceAfter: 0,
    },
  });

  const eventId = `evt_${suffix}`;
  const body = JSON.stringify({
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          order_id: orderId,
          id: `pay_${suffix}`,
          amount: 20000,
        },
      },
    },
  });

  const signature = crypto.createHmac('sha256', secret).update(body).digest('hex');

  const headers = {
    'Content-Type': 'application/json',
    'x-razorpay-signature': signature,
    'x-razorpay-event-id': eventId,
  };

  const { POST } = await import('../app/api/webhooks/razorpay/route');

  const req1 = new Request('http://localhost/api/webhooks/razorpay', { method: 'POST', headers, body });
  const res1 = await POST(req1);
  const req2 = new Request('http://localhost/api/webhooks/razorpay', { method: 'POST', headers, body });
  const res2 = await POST(req2);

  const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  const balance = Number(updated.balance);
  const events = await prisma.razorpayWebhookEvent.count({ where: { eventId } });

  if (balance !== 200) {
    throw new Error(`Expected balance 200 after webhook, got ${balance}`);
  }
  if (events !== 1) {
    throw new Error(`Expected 1 stored webhook event, got ${events}`);
  }
  if (!res1.ok || !res2.ok) {
    throw new Error('Webhook requests should both return success (second is duplicate)');
  }

  console.log('Razorpay webhook idempotency test passed');

  await prisma.razorpayWebhookEvent.deleteMany({ where: { eventId } });
  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
