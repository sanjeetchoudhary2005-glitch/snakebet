import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Facebook from 'next-auth/providers/facebook';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from '@/lib/session';
import { generateReferralCode } from '@/lib/otp';
import { cookies } from 'next/headers';

const providers = [];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

if (process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET) {
  providers.push(
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

export const { handlers, signIn, signOut, auth: nextAuthSession } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET || process.env.SESSION_SECRET,
  providers,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'database',
  },
  callbacks: {
    async signIn({ user }) {
      return Boolean(user.email || user.id);
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      const baseUsername =
        user.email?.split('@')[0]?.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20) ||
        `player${user.id.slice(-6)}`;
      let username = baseUsername;
      let suffix = 0;
      while (await prisma.user.findFirst({ where: { username, NOT: { id: user.id } } })) {
        suffix += 1;
        username = `${baseUsername}${suffix}`;
      }
      await prisma.user.update({
        where: { id: user.id },
        data: {
          username,
          referralCode: generateReferralCode(username),
          isVerified: true,
          name: user.name || username,
        },
      });
    },
    async signIn({ user }) {
      if (!user.id) return;
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      });
      const cookieStore = await cookies();
      cookieStore.set(
        SESSION_COOKIE,
        createSessionToken(user.id, dbUser?.role || 'USER'),
        sessionCookieOptions()
      );
    },
  },
  trustHost: true,
});
