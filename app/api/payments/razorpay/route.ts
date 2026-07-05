import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { auth } from '@/auth'
import { isNextResponse, parseJson } from '@/lib/api'
import { assertWithinDailyDepositLimit } from '@/lib/responsibleGaming'

const razorpaySchema = z.object({
  amount: z.number().min(200).max(100000),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = await parseJson(req, razorpaySchema)
    if (isNextResponse(parsed)) return parsed
    const { amount } = parsed
    const userId = session.user.id
    
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY;
    const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET;
    if (!keyId || !keySecret) {
      return NextResponse.json({ error: 'Razorpay not configured' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    await assertWithinDailyDepositLimit(userId, amount);

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    })
    
    const orderId = `deposit_${userId}_${Date.now()}`;

    const order = await razorpay.orders.create({
      amount: amount * 100, // in paise
      currency: 'INR',
      receipt: orderId,
      notes: { order_id: orderId }
    })

    // Create pending transaction linked to the Razorpay order id for webhook idempotency.
    await prisma.transaction.create({
      data: {
        userId,
        amount,
        type: 'DEPOSIT',
        status: 'PENDING',
        method: 'CARD',
        reference: order.id,
        balanceBefore: user.balance,
        balanceAfter: user.balance,
      }
    })

    return NextResponse.json({ orderId: order.id, id: order.id, receipt: orderId, amount: amount * 100, currency: 'INR', keyId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create Razorpay order'
    console.error(error);
    return NextResponse.json({ error: message }, { status: message === 'Daily deposit limit exceeded' ? 400 : 500 })
  }
}
