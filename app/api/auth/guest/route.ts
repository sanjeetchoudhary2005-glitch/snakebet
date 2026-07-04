import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateReferralCode } from '@/lib/otp';
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from '@/auth';

export async function POST() {
  try {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const username = `guest_${randomSuffix}`;
    const email = `${username}@Snakebet.demo`;
    const referralCode = generateReferralCode(username);

    // Create the guest user with pre-filled balance and email verified
    const user = await prisma.user.create({
      data: {
        username,
        email,
        referralCode,
        isVerified: true,
        balance: 10000.00,
      },
    });

    const response = NextResponse.json({
      message: 'Guest login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        balance: user.balance,
      },
    });

    response.cookies.set(
      SESSION_COOKIE,
      createSessionToken(user.id, user.role),
      sessionCookieOptions()
    );

    return response;
  } catch (error) {
    console.error('Guest login failed:', error);
    return NextResponse.json({ error: 'Failed to initiate guest play' }, { status: 500 });
  }
}
