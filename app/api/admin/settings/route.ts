import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { getRedisClient } from '@/lib/redis';

export async function GET(request: Request) {
  const session = await verifySession(request);
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const redis = await getRedisClient();
    if (!redis) return NextResponse.json({ error: 'Redis offline' }, { status: 500 });

    const maintenanceMode = await redis.get('maintenance_mode');
    
    return NextResponse.json({ 
      maintenanceMode: maintenanceMode === 'true'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await verifySession(request);
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { maintenanceMode } = await request.json();
    const redis = await getRedisClient();
    if (!redis) return NextResponse.json({ error: 'Redis offline' }, { status: 500 });

    await redis.set('maintenance_mode', maintenanceMode ? 'true' : 'false');

    return NextResponse.json({ success: true, maintenanceMode });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
