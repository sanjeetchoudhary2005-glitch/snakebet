import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const accounts = await prisma.paymentAccount.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' }
    });

    const formatted = accounts.map(acc => ({
      id: acc.id,
      type: acc.type,
      label: acc.label,
      details: JSON.parse(acc.details || '{}'),
      qrCodeUrl: acc.qrCodeUrl,
      minAmount: Number(acc.minAmount),
      maxAmount: Number(acc.maxAmount)
    }));

    return NextResponse.json(formatted);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
