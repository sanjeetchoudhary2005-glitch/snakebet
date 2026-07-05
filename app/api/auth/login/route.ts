
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { enforceAuthRateLimit } from '@/lib/rateLimit';
import { isNextResponse, parseJson } from '@/lib/api';
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from '@/auth';

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(256),
});

export async function POST(req: Request) {
  try {
    const parsed = await parseJson(req, loginSchema);
    if (isNextResponse(parsed)) return parsed;
    const { email, password } = parsed;

    const limited = await enforceAuthRateLimit(req, email, 'login');
    if (limited) return limited;

    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!user.isVerified) {
      return NextResponse.json({ error: 'Please verify your email first' }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date(), loginAttempts: 0 },
    });

    const response = NextResponse.json({ 
      message: 'Login successful', 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        balance: user.balance 
      } 
    });
    response.cookies.set(SESSION_COOKIE, createSessionToken(user.id, user.role), sessionCookieOptions());
    return response;

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
