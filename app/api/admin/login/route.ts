import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from '@/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { email: username }
        ]
      }
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
    }

    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access denied. Account does not have admin privileges.' }, { status: 403 });
    }

    const token = createSessionToken(user.id, user.role);
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions());

    // Record admin log
    await prisma.adminLog.create({
      data: {
        adminId: user.id,
        action: 'ADMIN_LOGIN',
        details: 'Admin logged into the portal'
      }
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Internal server error during login' }, { status: 500 });
  }
}
