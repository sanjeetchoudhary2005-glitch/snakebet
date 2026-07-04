import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await verifySession(request);
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let lastTxId = '';
  let lastLogId = '';

  // Get initial latest IDs to not send old data
  try {
    const [latestTx, latestLog] = await Promise.all([
      prisma.transaction.findFirst({ orderBy: { createdAt: 'desc' }, select: { id: true } }),
      prisma.adminLog.findFirst({ orderBy: { createdAt: 'desc' }, select: { id: true } })
    ]);
    lastTxId = latestTx?.id || '';
    lastLogId = latestLog?.id || '';
  } catch (e) {}

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue('retry: 5000\\n\\n');

      const interval = setInterval(async () => {
        try {
          // Poll for new transactions
          const newTxs = await prisma.transaction.findMany({
            where: lastTxId ? { id: { gt: lastTxId } } : undefined,
            include: { user: { select: { username: true } } },
            orderBy: { id: 'asc' }
          });

          // Poll for new admin logs
          const newLogs = await prisma.adminLog.findMany({
            where: lastLogId ? { id: { gt: lastLogId } } : undefined,
            include: { admin: { select: { username: true } } },
            orderBy: { id: 'asc' }
          });

          if (newTxs.length > 0) {
            lastTxId = newTxs[newTxs.length - 1].id;
            for (const tx of newTxs) {
              const data = {
                type: 'transaction',
                id: tx.id,
                action: tx.type,
                amount: tx.amount,
                username: tx.user?.username || 'Unknown',
                game: tx.gameId,
                timestamp: tx.createdAt
              };
              controller.enqueue(\`data: \${JSON.stringify(data)}\\n\\n\`);
            }
          }

          if (newLogs.length > 0) {
            lastLogId = newLogs[newLogs.length - 1].id;
            for (const log of newLogs) {
              const data = {
                type: 'admin_action',
                id: log.id,
                action: log.action,
                username: log.admin?.username || 'Admin',
                details: log.details,
                timestamp: log.createdAt
              };
              controller.enqueue(\`data: \${JSON.stringify(data)}\\n\\n\`);
            }
          }
        } catch (err) {
          // Ignore polling errors
        }
      }, 2000);

      // Cleanup on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
