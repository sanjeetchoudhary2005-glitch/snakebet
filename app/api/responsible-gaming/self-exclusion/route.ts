import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getActiveSelfExclusion, selfExclusionUntil } from '@/lib/responsibleGaming';
import { isNextResponse, parseJson } from '@/lib/api';

const selfExclusionSchema = z.object({
  period: z.enum(['24h', '7d', '30d', 'permanent']),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const exclusion = await getActiveSelfExclusion(session.user.id);
  return NextResponse.json({ active: Boolean(exclusion), exclusion });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = await parseJson(req, selfExclusionSchema);
  if (isNextResponse(parsed)) return parsed;

  const exclusion = await prisma.selfExclusion.create({
    data: {
      userId: session.user.id,
      until: selfExclusionUntil(parsed.period),
    },
  });

  await prisma.responsibleGamingSettings.upsert({
    where: { userId: session.user.id },
    update: { selfExcludedUntil: exclusion.until },
    create: {
      userId: session.user.id,
      selfExcludedUntil: exclusion.until,
    },
  });

  return NextResponse.json({ active: true, exclusion });
}
