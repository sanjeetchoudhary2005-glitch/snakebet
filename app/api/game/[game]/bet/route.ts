import { NextResponse } from 'next/server';

type RouteParams = { params: Promise<{ game: string }> };

const routeMap: Record<string, string> = {
  dice: '/api/games/dice',
  mines: '/api/games/mines/start',
  plinko: '/api/games/plinko/play',
  limbo: '/api/games/limbo/play',
  wheel: '/api/games/wheel/play',
  keno: '/api/games/keno/play',
  coinflip: '/api/games/coinflip/play',
  slots: '/api/games/slots/spin',
  roulette: '/api/games/roulette/spin',
  blackjack: '/api/games/blackjack/start',
  hilo: '/api/games/hilo/start',
  dragontower: '/api/games/dragontower/start',
  'dragon-tower': '/api/games/dragontower/start',
  'andar-bahar': '/api/games/andar-bahar/play',
  baccarat: '/api/games/baccarat/play',
  'teen-patti': '/api/games/teen-patti/play',
};

function normalizePayload(game: string, body: Record<string, unknown>) {
  const amount = typeof body.amount === 'number' ? body.amount : body.betAmount;
  const base: Record<string, unknown> = { ...body, betAmount: amount };
  delete base.amount;

  if (game === 'mines' && typeof body.mines === 'number') {
    base.mineCount = body.mines;
  }
  if ((game === 'plinko' || game === 'wheel') && typeof body.risk === 'string') {
    base.riskLevel = body.risk.charAt(0).toUpperCase() + body.risk.slice(1).toLowerCase();
  }
  if (game === 'keno' && Array.isArray(body.picks)) {
    base.pickedNumbers = body.picks;
  }
  if (game === 'roulette' && typeof body.bet === 'string' && typeof amount === 'number') {
    base.bets = [{ type: body.bet, amount }];
    delete base.betAmount;
  }
  if (game === 'baccarat' && typeof body.bet === 'string') {
    base.betType = body.bet;
  }
  if (game === 'teen-patti' && typeof body.bootAmount === 'number') {
    base.betAmount = body.amount ?? body.bootAmount;
  }

  return base;
}

export async function POST(req: Request, { params }: RouteParams) {
  const { game: rawGame } = await params;
  const game = rawGame.toLowerCase();
  const target = routeMap[game];
  if (!target) {
    return NextResponse.json({ error: 'Unsupported game' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const url = new URL(target, req.url);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: req.headers.get('cookie') || '',
    },
    body: JSON.stringify(normalizePayload(game, body)),
  });

  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') || 'application/json',
    },
  });
}
