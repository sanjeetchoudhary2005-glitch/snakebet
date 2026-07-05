
import { NextResponse } from 'next/server';

const matches = [
  {
    id: '1',
    homeTeam: 'Manchester United',
    awayTeam: 'Liverpool',
    homeOdds: 2.5,
    drawOdds: 3.2,
    awayOdds: 2.8,
    time: '2 hours',
    live: true,
  },
  {
    id: '2',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    homeOdds: 2.2,
    drawOdds: 3.5,
    awayOdds: 3.0,
    time: '5 hours',
    live: false,
  },
];

export async function GET() {
  return NextResponse.json(matches);
}
