/**
 * Phase 1 casino QA — wallet debit/credit smoke for all 17 shipped games.
 * Run: DATABASE_URL=postgresql://... npm run test:phase1-games
 */
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { placeBet, settleBet, getBalance } from '../lib/wallet';

const GAMES = [
  'ludo',
  'mines',
  'crash',
  'plinko',
  'dice',
  'coinflip',
  'wheel',
  'hilo',
  'keno',
  'dragontower',
  'roulette',
  'blackjack',
  'slots',
  'andar-bahar',
  'baccarat',
  'teen-patti',
  'dragontiger',
] as const;

type GameResult = { game: string; pass: boolean; error?: string };

async function testGame(gameId: string, userId: string): Promise<GameResult> {
  const roundId = `qa-${gameId}-${Date.now()}`;
  // Use betAmount of 50 to satisfy minimum bet limits (e.g. blackjack/ludo min bet is 50)
  const betAmount = 50;
  try {
    const before = Number(await getBalance(userId));
    await placeBet({ userId, gameId, roundId, amount: betAmount });
    const afterBet = Number(await getBalance(userId));
    if (afterBet !== before - betAmount) {
      return { game: gameId, pass: false, error: `Bet debit mismatch: ${before} -> ${afterBet}` };
    }

    await settleBet({ userId, gameId: gameId, roundId, payout: betAmount * 2 });
    const afterWin = Number(await getBalance(userId));
    if (afterWin !== before + betAmount) {
      return { game: gameId, pass: false, error: `Win credit mismatch: expected ${before + betAmount}, got ${afterWin}` };
    }

    return { game: gameId, pass: true };
  } catch (error) {
    return {
      game: gameId,
      pass: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  const suffix = `${Date.now()}`;

  // Upsert a high liquidity house pool so exposure limit checks pass easily
  await prisma.housePool.upsert({
    where: { id: 'global' },
    update: { totalLiquidity: 50000000.0, platformPaused: false },
    create: { id: 'global', totalLiquidity: 50000000.0, baselineLiquidity: 50000000.0, currentExposure: 0.0, platformPaused: false }
  });

  const user = await prisma.user.create({
    data: {
      email: `phase1-qa-${suffix}@example.test`,
      username: `qa_${suffix}`.slice(0, 32),
      password: 'not-used',
      referralCode: `QA_${suffix}`.slice(0, 32),
      isVerified: true,
      balance: new Prisma.Decimal(5000),
    },
  });

  const results: GameResult[] = [];
  try {
    for (const game of GAMES) {
      results.push(await testGame(game, user.id));
    }

    const failed = results.filter((r) => !r.pass);
    console.log('\nPhase 1 game wallet QA results:');
    for (const r of results) {
      console.log(`  ${r.pass ? 'PASS' : 'FAIL'}  ${r.game}${r.error ? ` — ${r.error}` : ''}`);
    }

    if (failed.length > 0) {
      process.exitCode = 1;
    } else {
      console.log('\nAll 17 games passed wallet debit/credit QA.');
    }
  } finally {
    // Delete any created transaction records
    await prisma.transaction.deleteMany({ where: { userId: user.id } });

    // Clean up any rounds referencing the user to avoid foreign key constraint violations
    await prisma.diceRound.deleteMany({ where: { userId: user.id } }).catch(() => {});
    await prisma.coinFlipRound.deleteMany({ where: { userId: user.id } }).catch(() => {});
    await prisma.wheelRound.deleteMany({ where: { userId: user.id } }).catch(() => {});
    await prisma.plinkoRound.deleteMany({ where: { userId: user.id } }).catch(() => {});
    await prisma.hiLoRound.deleteMany({ where: { userId: user.id } }).catch(() => {});
    await prisma.minesRound.deleteMany({ where: { userId: user.id } }).catch(() => {});
    await prisma.blackjackRound.deleteMany({ where: { userId: user.id } }).catch(() => {});
    await prisma.rouletteRound.deleteMany({ where: { userId: user.id } }).catch(() => {});
    await prisma.baccaratRound.deleteMany({ where: { userId: user.id } }).catch(() => {});
    await prisma.andarBaharRound.deleteMany({ where: { userId: user.id } }).catch(() => {});
    await prisma.teenPattiRound.deleteMany({ where: { userId: user.id } }).catch(() => {});
    await prisma.dragonTigerRound.deleteMany({ where: { userId: user.id } }).catch(() => {});
    await prisma.kenoRound.deleteMany({ where: { userId: user.id } }).catch(() => {});
    await prisma.dragonTowerRound.deleteMany({ where: { userId: user.id } }).catch(() => {});
    await prisma.slotsRound.deleteMany({ where: { userId: user.id } }).catch(() => {});
    await prisma.ludoPlayer.deleteMany({ where: { userId: user.id } }).catch(() => {});
    await prisma.ludoMove.deleteMany({ where: { userId: user.id } }).catch(() => {});
    await prisma.vipProgress.deleteMany({ where: { userId: user.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
