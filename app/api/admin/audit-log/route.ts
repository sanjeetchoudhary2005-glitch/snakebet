import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin';

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 50)));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.adminLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        admin: {
          select: { id: true, username: true, email: true, role: true },
        },
      },
    }),
    prisma.adminLog.count(),
  ]);

  return NextResponse.json({
    items: items.map((item) => ({
      ...item,
      details: item.details ? JSON.parse(item.details) : null,
    })),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}
