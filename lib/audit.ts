import { prisma } from '@/lib/prisma';

export async function logSecurityEvent(
  event: string,
  userId: string | null = null,
  details: Record<string, any> = {},
  req?: Request
) {
  const ip =
    req?.headers.get('x-forwarded-for') ||
    req?.headers.get('x-real-ip') ||
    '';
  const userAgent = req?.headers.get('user-agent') || '';

  await prisma.securityLog.create({
    data: {
      userId,
      event,
      ip,
      userAgent,
      details: JSON.stringify(details),
    },
  });
}

export async function logAdminAction(
  adminId: string,
  action: string,
  targetId: string | null = null,
  details: Record<string, any> = {}
) {
  await prisma.adminLog.create({
    data: {
      adminId,
      action,
      targetId,
      details: JSON.stringify(details),
    },
  });
}
