import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isNextResponse, parseJson } from '@/lib/api';

const settingsSchema = z.object({
  depositLimitDaily: z.number().min(200).max(1000000).optional(),
  sessionLimit: z.number().int().min(5).max(1440).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = await prisma.responsibleGamingSettings.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({
    depositLimitDaily: settings?.depositLimit ? Number(settings.depositLimit) : null,
    sessionLimit: settings?.sessionLimitMinutes ?? null,
    selfExcludedUntil: settings?.selfExcludedUntil ?? null,
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = await parseJson(req, settingsSchema);
  if (isNextResponse(parsed)) return parsed;

  const settings = await prisma.responsibleGamingSettings.upsert({
    where: { userId: session.user.id },
    update: {
      depositLimit: parsed.depositLimitDaily,
      sessionLimitMinutes: parsed.sessionLimit,
    },
    create: {
      userId: session.user.id,
      depositLimit: parsed.depositLimitDaily,
      sessionLimitMinutes: parsed.sessionLimit,
    },
  });

  return NextResponse.json({
    depositLimitDaily: settings.depositLimit ? Number(settings.depositLimit) : null,
    sessionLimit: settings.sessionLimitMinutes ?? null,
    selfExcludedUntil: settings.selfExcludedUntil ?? null,
  });
}
