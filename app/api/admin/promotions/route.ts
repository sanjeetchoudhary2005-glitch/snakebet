import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' }
    });
    const promotions = await prisma.promotion.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const formattedPromotions = promotions.map(p => ({
      ...p,
      maxBonus: Number(p.maxBonus)
    }));

    return NextResponse.json({ announcements, promotions: formattedPromotions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const { itemType, action, id, title, content, type, matchPercentage, maxBonus, wageringMultiplier, startDate, endDate, isActive } = body;

    if (itemType === 'ANNOUNCEMENT') {
      if (action === 'DELETE') {
        await prisma.announcement.delete({ where: { id } });
        return NextResponse.json({ success: true });
      }

      if (id) {
        const updated = await prisma.announcement.update({
          where: { id },
          data: { title, content, isActive: Boolean(isActive) }
        });
        return NextResponse.json(updated);
      } else {
        const created = await prisma.announcement.create({
          data: { title, content, isActive: isActive !== undefined ? Boolean(isActive) : true }
        });
        return NextResponse.json(created);
      }
    }

    if (itemType === 'PROMOTION') {
      if (action === 'DELETE') {
        await prisma.promotion.delete({ where: { id } });
        return NextResponse.json({ success: true });
      }

      if (id) {
        const updated = await prisma.promotion.update({
          where: { id },
          data: {
            title,
            type,
            matchPercentage: Number(matchPercentage),
            maxBonus: Number(maxBonus),
            wageringMultiplier: Number(wageringMultiplier),
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            isActive: Boolean(isActive)
          }
        });
        return NextResponse.json(updated);
      } else {
        const created = await prisma.promotion.create({
          data: {
            title,
            type,
            matchPercentage: Number(matchPercentage),
            maxBonus: Number(maxBonus),
            wageringMultiplier: Number(wageringMultiplier),
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            isActive: isActive !== undefined ? Boolean(isActive) : true
          }
        });
        return NextResponse.json(created);
      }
    }

    return NextResponse.json({ error: 'Invalid itemType' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
