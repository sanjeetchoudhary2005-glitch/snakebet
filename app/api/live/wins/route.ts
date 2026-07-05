import { NextResponse } from 'next/server';
import { getRecentWinsByGame } from '@/lib/live-activity';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const gameId = searchParams.get('gameId');
    const limit = Number(searchParams.get('limit') || 5);

    if (!gameId) {
      return NextResponse.json({ error: 'gameId required' }, { status: 400 });
    }

    const wins = await getRecentWinsByGame(gameId, limit);
    return NextResponse.json({ wins });
  } catch (error) {
    console.error('Recent wins error:', error);
    return NextResponse.json({ error: 'Failed to load wins' }, { status: 500 });
  }
}
