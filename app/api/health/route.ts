import { NextResponse } from 'next/server';
import { checkDatabaseHealth, checkRedisHealth, checkWebSocketHealth } from '@/lib/prisma';
import { sendHealthAlert } from '@/lib/alerting';

export async function GET() {
  const [database, redis, websocket] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
    checkWebSocketHealth(),
  ]);

  const checks = {
    database,
    redis,
    websocket,
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };

  const healthy =
    database.healthy !== false &&
    redis.healthy !== false &&
    websocket.healthy !== false;

  if (!healthy) {
    await sendHealthAlert('One or more dependencies are unhealthy', checks);
  }

  return NextResponse.json(
    { status: healthy ? 'healthy' : 'unhealthy', ...checks },
    { status: healthy ? 200 : 503 }
  );
}
