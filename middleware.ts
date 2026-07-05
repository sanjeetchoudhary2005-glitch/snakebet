import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/auth';
import { apiLimiter, authLimiter, fallbackRateLimit } from '@/lib/rateLimit';
import { resetRedisClient } from '@/lib/redis';
import { getRedisClient } from '@/lib/redis';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const ip = request.headers.get('x-forwarded-for') || 'unknown';

  // Rate limiting with fallback
  try {
    if (path.startsWith('/api/auth')) {
      const rate = await authLimiter.limit(ip);
      if (!rate.success) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
      }
    } else if (path.startsWith('/api')) {
      const rate = await apiLimiter.limit(ip);
      if (!rate.success) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
      }
    }
  } catch (error) {
    console.warn('Upstash rate limiter failed, using fallback:', error);
    resetRedisClient();
    // Fallback to in-memory rate limiter
    if (path.startsWith('/api/auth')) {
      const rate = await fallbackRateLimit(ip, 10, 60);
      if (!rate.success) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
      }
    } else if (path.startsWith('/api')) {
      const rate = await fallbackRateLimit(ip, 100, 60);
      if (!rate.success) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
      }
    }
  }

  const session = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  // MAINTENANCE MODE CHECK
  if (!path.startsWith('/admin') && !path.startsWith('/api/admin') && !path.startsWith('/maintenance') && !path.match(/\.(png|svg|jpg|webp|css|js|ico)$/)) {
    try {
      const redis = await getRedisClient();
      if (redis) {
        const maintenanceMode = await redis.get('maintenance_mode');
        if (maintenanceMode === 'true' && session?.role !== 'ADMIN' && session?.role !== 'SUPER_ADMIN') {
          return NextResponse.rewrite(new URL('/maintenance', request.url));
        }
      }
    } catch (e) {
      console.warn("Could not check maintenance mode", e);
    }
  }

  // STANDARD PROTECTED ROUTES
  const protectedPage =
    path.startsWith('/dashboard') ||
    path.startsWith('/wallet') ||
    path.startsWith('/transactions') ||
    path.startsWith('/profile') ||
    path.startsWith('/settings') ||
    path.startsWith('/notifications') ||
    path.startsWith('/promotions') ||
    path.startsWith('/responsible-gaming') ||
    path.startsWith('/games');

  if (protectedPage && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', path);
    return NextResponse.redirect(loginUrl);
  }

  // ADMIN ROUTES PROTECTION
  if ((path.startsWith('/admin') || path.startsWith('/api/admin')) && path !== '/admin/login') {
    const isAdmin = session?.role === 'ADMIN' || session?.role === 'SUPER_ADMIN';

    if (!session) {
       // Only redirect to admin login if they are trying to access admin pages.
       // For API routes, return 401
       if (path.startsWith('/api/')) {
         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
       }
       return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // IP whitelist check for admin
    const allowedIPs = process.env.ADMIN_IPS?.split(',') || [];
    const isIPAllowed = allowedIPs.length === 0 || allowedIPs.includes(ip);

    if (!isAdmin || !isIPAllowed) {
      if (path.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Webhook signature check
  if (path.startsWith('/api/webhooks')) {
    const signature = request.headers.get('x-razorpay-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }
  }

  // Block known bad user agents
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';
  const blocklist = ['curl', 'wget', 'python', 'scrapy', 'headless'];
  if (blocklist.some((b) => userAgent.includes(b))) {
    return NextResponse.json({ error: 'Blocked' }, { status: 403 });
  }

  const response = NextResponse.next();

  if (session?.userId && !path.startsWith('/api/internal/active')) {
    void fetch(new URL('/api/internal/active', request.url), {
      method: 'POST',
      headers: { cookie: request.headers.get('cookie') || '' },
    }).catch(() => undefined);
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/:path*',
    '/dashboard/:path*',
    '/wallet/:path*',
    '/transactions/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/notifications/:path*',
    '/promotions/:path*',
    '/responsible-gaming/:path*',
    '/games/:path*',
  ],
};
