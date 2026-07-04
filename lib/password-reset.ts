import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { invalidateUserSessions } from '@/lib/session';

const RESET_TTL_MS = 60 * 60 * 1000;

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

export async function createPasswordResetToken(email: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await prisma.user.findFirst({ where: { email: email.toLowerCase() } });
  if (!user || !user.password) {
    // Do not reveal whether account exists
    return { ok: true };
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TTL_MS);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const resetUrl = `${appUrl()}/login?reset=${encodeURIComponent(rawToken)}`;

  const result = await sendEmail({
    to: user.email!,
    subject: 'Reset your Snakebet password',
    text: `Reset your password: ${resetUrl}\nThis link expires in 1 hour.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2>Reset your password</h2>
        <p>Click the button below to choose a new password. This link expires in 1 hour.</p>
        <p><a href="${resetUrl}" style="display:inline-block;background:#00E701;color:#000;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">Reset password</a></p>
        <p style="color:#888;font-size:14px;">If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return { ok: true };
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<{ ok: true } | { ok: false; error: string; status?: number }> {
  const tokenHash = hashToken(token);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record) {
    return { ok: false, error: 'Invalid or expired reset link', status: 400 };
  }
  if (record.usedAt) {
    return { ok: false, error: 'This reset link has already been used', status: 400 };
  }
  if (record.expiresAt < new Date()) {
    return { ok: false, error: 'This reset link has expired', status: 400 };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { password: hashedPassword },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.updateMany({
      where: {
        userId: record.userId,
        usedAt: null,
        id: { not: record.id },
      },
      data: { usedAt: new Date() },
    }),
  ]);

  await invalidateUserSessions(record.userId);

  return { ok: true };
}
