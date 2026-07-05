export {
  SESSION_COOKIE,
  auth,
  createSessionToken,
  verifySessionToken,
  sessionCookieOptions,
  setSessionCookie,
  clearSessionCookie,
  invalidateUserSessions,
  verifySession
} from '@/lib/auth';
export type { AuthSession } from '@/lib/session';

export { handlers, signIn, signOut } from '@/lib/next-auth';
