import { PrismaClient } from '@prisma/client';
import net from 'net';
import { pingRedisWithRetry } from '@/lib/redis';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { healthy: true };
  } catch (error) {
    return { healthy: false, error: String(error) };
  }
}

export async function checkRedisHealth() {
  try {
    return await pingRedisWithRetry();
  } catch (error) {
    return { healthy: false, configured: Boolean(process.env.UPSTASH_REDIS_REST_URL), error: String(error) };
  }
}

export async function checkWebSocketHealth() {
  const port = Number(process.env.WS_PORT || 8080);
  const host = process.env.WS_HOST || '127.0.0.1';

  return new Promise<{ healthy: boolean; host: string; port: number; error?: string }>((resolve) => {
    const socket = net.createConnection({ host, port });
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve({ healthy: false, host, port, error: 'timeout' });
    }, 1000);

    socket.once('connect', () => {
      clearTimeout(timeout);
      socket.end();
      resolve({ healthy: true, host, port });
    });

    socket.once('error', (error) => {
      clearTimeout(timeout);
      resolve({ healthy: false, host, port, error: error.message });
    });
  });
}

// Graceful shutdown
if (typeof process !== 'undefined' && typeof process.on === 'function') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}
