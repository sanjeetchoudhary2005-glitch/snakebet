import { createHmac, randomBytes } from 'crypto';

const SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET || 'dev-secret';

export function generateCSRFToken(sessionId: string): string {
  const salt = randomBytes(16).toString('hex');
  const token = createHmac('sha256', SECRET)
    .update(`${sessionId}:${salt}`)
    .digest('hex');
  return `${salt}:${token}`;
}

export function verifyCSRFToken(sessionId: string, token: string): boolean {
  try {
    const [salt, hash] = token.split(':');
    if (!salt || !hash) return false;
    const expected = createHmac('sha256', SECRET)
      .update(`${sessionId}:${salt}`)
      .digest('hex');
    return hash === expected;
  } catch {
    return false;
  }
}
