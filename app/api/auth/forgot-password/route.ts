import { NextResponse } from 'next/server';
import { z } from 'zod';
import { enforceAuthRateLimit } from '@/lib/rateLimit';
import { isNextResponse, parseJson } from '@/lib/api';
import { createPasswordResetToken } from '@/lib/password-reset';

const schema = z.object({
  email: z.string().email().max(254),
});

export async function POST(req: Request) {
  try {
    const parsed = await parseJson(req, schema);
    if (isNextResponse(parsed)) return parsed;
    const { email } = parsed;

    const limited = await enforceAuthRateLimit(req, email, 'forgot-password');
    if (limited) return limited;

    const result = await createPasswordResetToken(email);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 503 });
    }

    return NextResponse.json({
      message: 'If the email matches an account, a reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
