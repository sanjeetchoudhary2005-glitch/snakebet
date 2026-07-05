import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isNextResponse, parseJson } from '@/lib/api';
import { resetPasswordWithToken } from '@/lib/password-reset';

const schema = z.object({
  token: z.string().min(32).max(128),
  password: z.string().min(8).max(128),
});

export async function POST(req: Request) {
  try {
    const parsed = await parseJson(req, schema);
    if (isNextResponse(parsed)) return parsed;
    const { token, password } = parsed;

    const result = await resetPasswordWithToken(token, password);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }

    return NextResponse.json({ message: 'Password updated. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
