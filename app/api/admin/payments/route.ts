import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const accounts = await prisma.paymentAccount.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { depositRequests: true }
        }
      }
    });

    const formatted = accounts.map(acc => ({
      ...acc,
      details: JSON.parse(acc.details || '{}'),
      usageCount: acc._count.depositRequests
    }));

    return NextResponse.json(formatted);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const { type, label, details, qrCodeUrl, minAmount, maxAmount, isActive } = body;

    if (!type || !label || !details) {
      return NextResponse.json({ error: 'Type, label, and details are required' }, { status: 400 });
    }

    const newAccount = await prisma.paymentAccount.create({
      data: {
        type,
        label,
        details: typeof details === 'string' ? details : JSON.stringify(details),
        qrCodeUrl: qrCodeUrl || null,
        minAmount: minAmount !== undefined ? Number(minAmount) : 100,
        maxAmount: maxAmount !== undefined ? Number(maxAmount) : 100000,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      }
    });

    return NextResponse.json(newAccount);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const { id, type, label, details, qrCodeUrl, minAmount, maxAmount, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
    }

    const updateData: any = {};
    if (type) updateData.type = type;
    if (label) updateData.label = label;
    if (details) updateData.details = typeof details === 'string' ? details : JSON.stringify(details);
    if (qrCodeUrl !== undefined) updateData.qrCodeUrl = qrCodeUrl;
    if (minAmount !== undefined) updateData.minAmount = Number(minAmount);
    if (maxAmount !== undefined) updateData.maxAmount = Number(maxAmount);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await prisma.paymentAccount.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
    }

    await prisma.paymentAccount.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
