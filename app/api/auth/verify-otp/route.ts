
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkOTPVerifyRateLimit } from '@/lib/rateLimiter';
import { z } from 'zod';
import { enforceAuthRateLimit } from '@/lib/rateLimit';
import { isNextResponse, parseJson } from '@/lib/api';

const verifyOtpSchema = z.object({
  userId: z.string().min(1),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

export async function POST(req: Request) {
  try {
    const parsed = await parseJson(req, verifyOtpSchema);
    if (isNextResponse(parsed)) return parsed;
    const { userId, otp } = parsed;

    // Get user first to get their email for rate limiting
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user?.email) {
      return NextResponse.json({ error: 'User not found' }, { status: 400 });
    }

    const limited = await enforceAuthRateLimit(req, user.email, 'verify-otp');
    if (limited) return limited;

    // Check OTP verify rate limit
    const rateLimit = await checkOTPVerifyRateLimit(user.email);
    if (!rateLimit.allowed) {
      const resetIn = Math.ceil((rateLimit.resetTime! - Date.now()) / 1000);
      return NextResponse.json(
        { error: `Too many verification attempts. Try again in ${Math.ceil(resetIn / 60)} minutes.` },
        { status: 429, headers: { 'Retry-After': resetIn.toString() } }
      );
    }

    const record = await prisma.otp.findFirst({
      where: {
        userId,
        otp,
        expiresAt: { gt: new Date() },
        used: false,
      },
    });

    if (!record) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.otp.update({
        where: { id: record.id },
        data: { used: true },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { isVerified: true },
      }),
    ]);

    return NextResponse.json({
      message: 'Account verified!',
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
