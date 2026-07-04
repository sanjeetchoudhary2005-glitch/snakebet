
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { generateOTP, sendOTP, generateReferralCode } from '@/lib/otp';
import { checkOTPSendRateLimit } from '@/lib/rateLimiter';
import { z } from 'zod';
import { enforceAuthRateLimit } from '@/lib/rateLimit';
import { isNextResponse, parseJson } from '@/lib/api';

const signupSchema = z.object({
  username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/, 'Use letters, numbers, or underscores only'),
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  referralCode: z.string().trim().max(32).optional(),
});

export async function POST(req: Request) {
  try {
    const parsed = await parseJson(req, signupSchema);
    if (isNextResponse(parsed)) return parsed;
    const { username, email, password, referralCode } = parsed;

    const limited = await enforceAuthRateLimit(req, email, 'signup');
    if (limited) return limited;

    // Check OTP send rate limit first
    const rateLimit = await checkOTPSendRateLimit(email);
    if (!rateLimit.allowed) {
      const resetIn = Math.ceil((rateLimit.resetTime! - Date.now()) / 1000);
      return NextResponse.json(
        { error: `Too many OTP requests. Try again in ${Math.ceil(resetIn / 60)} minutes.` },
        { status: 429, headers: { 'Retry-After': resetIn.toString() } }
      );
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const code = generateReferralCode(username);

    let referredByUser = null;
    if (referralCode) {
      referredByUser = await prisma.user.findFirst({
        where: { referralCode: referralCode },
      });
    }

    const user = await prisma.user.create({
      data: {
        username,
        email, // email is required here because we checked it earlier
        password: hashedPassword,
        referralCode: code,
        referredBy: referredByUser?.id || null,
        balance: 0,
      },
    });

    const otp = generateOTP();
    await prisma.otp.create({
      data: {
        userId: user.id,
        otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await sendOTP(user.email!, otp);

    return NextResponse.json({
      message: 'Account created. Please verify OTP.',
      userId: user.id,
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Something went wrong';
    if (message.toLowerCase().includes('otp') || message.toLowerCase().includes('email')) {
      return NextResponse.json({ error: message }, { status: 503 });
    }
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
