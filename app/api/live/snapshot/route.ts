import { NextResponse } from 'next/server';
import { getLiveSnapshot } from '@/lib/live-activity';

export async function GET() {
  try {
    const snapshot = await getLiveSnapshot();
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error('Live snapshot error:', error);
    return NextResponse.json({ error: 'Failed to load live data' }, { status: 500 });
  }
}
