import crypto from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { touchUserActive } from '@/lib/live-activity';

export const SESSION_COOKIE = 'bv_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
  userId: string;
  exp: number;
  role?: string;
  sessionVersion?: number;
};

export type AuthSession = {
  user: {
    id: string;
    name: string;
    email: string | null;
    role: string;
  };
};

function getSecret() {
  const secret = process.env.SESSION_SECRET || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET is required in production');
  }
  return 'Snakebet-dev-session-secret';
}

function base64Url(input: Buffer | string) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function sign(value: string) {
  return base64Url(crypto.createHmac('sha256', getSecret()).update(value).digest());
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function createSessionToken(userId: string, role?: string, sessionVersion = 0) {
  const payload: SessionPayload = {
    userId,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    role,
    sessionVersion,
  };
  const encoded = base64Url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

export function verifySessionToken(token?: string | null): SessionPayload | null {
  if (!token) return null;
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature || !safeEqual(sign(encoded), signature)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(encoded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
    ) as SessionPayload;
    if (!payload.userId || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  };
}

export async function setSessionCookie(userId: string, role?: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionToken(userId, role), sessionCookieOptions());
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 });
}

export async function auth(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const payload = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, username: true, email: true, role: true },
  });

  if (!user) return null;

  void touchUserActive(user.id).catch(() => undefined);

  return {
    user: {
      id: user.id,
      name: user.username,
      email: user.email,
      role: user.role,
    },
  };
}

export async function invalidateUserSessions(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });
}
