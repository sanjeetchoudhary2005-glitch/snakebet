import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  try {
    const now = new Date();
    const session = await auth();

    const announcements = await prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    const promotions = await prisma.promotion.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    let claimedIds = new Set<string>();
    if (session?.user?.id) {
      const claims = await prisma.promotionClaim.findMany({
        where: { userId: session.user.id },
        select: { promotionId: true, amountCredited: true, claimedAt: true },
      });
      claimedIds = new Set(claims.map((c) => c.promotionId));
    }

    const formattedPromotions = promotions.map((p) => ({
      id: p.id,
      title: p.title,
      type: p.type,
      matchPercentage: p.matchPercentage,
      maxBonus: Number(p.maxBonus),
      wageringMultiplier: p.wageringMultiplier,
      minDepositRequired: Number(p.minDepositRequired || 0),
      startDate: p.startDate,
      endDate: p.endDate,
      claimed: claimedIds.has(p.id),
    }));

    return NextResponse.json({ announcements, promotions: formattedPromotions });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load promotions';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
