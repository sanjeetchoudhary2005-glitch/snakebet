import { NextResponse } from 'next/server';
import { rtpMonitor } from '@/lib/monitoring/rtp';
import { requireAdmin } from '@/lib/admin';

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const stats = await rtpMonitor.getStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to get RTP stats', error);
    return NextResponse.json(
      { error: 'Failed to get RTP stats' },
      { status: 500 }
    );
  }
}
