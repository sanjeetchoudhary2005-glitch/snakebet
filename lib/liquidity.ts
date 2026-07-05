import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

export interface PoolStatus {
  totalLiquidity: number;
  baselineLiquidity: number;
  currentExposure: number;
  platformPaused: boolean;
}

// Fetch or initialize the single global HousePool row
export async function getHousePool(tx?: Prisma.TransactionClient): Promise<PoolStatus> {
  const db = tx || prisma;
  let pool = await db.housePool.findUnique({
    where: { id: 'global' },
  });

  if (!pool) {
    pool = await db.housePool.create({
      data: {
        id: 'global',
        totalLiquidity: 1000000.0,
        baselineLiquidity: 1000000.0,
        currentExposure: 0.0,
        platformPaused: false,
      },
    });
  }

  return {
    totalLiquidity: Number(pool.totalLiquidity),
    baselineLiquidity: Number(pool.baselineLiquidity),
    currentExposure: Number(pool.currentExposure),
    platformPaused: pool.platformPaused,
  };
}

// Get the maximum theoretical multiplier for a game to calculate risk exposure
export function getMaxMultiplier(gameId: string, payload?: any): number {
  const normalized = gameId.toLowerCase();
  switch (normalized) {
    case 'dice':
      // Dice max multiplier is 99x (e.g. 99% RTP / 1% win chance)
      return 99.0;
    case 'coinflip':
      return 2.0;
    case 'andar-bahar':
      return 2.0; // Bahar pays 2.0x, Andar 1.90x
    case 'baccarat':
      return 9.0; // Tie bet pays 9x
    case 'teen-patti':
      return 40.0; // Royal Flush side bet pays 40x (or standard hand wins)
    case 'roulette':
      return 36.0; // Single number bet pays 36x
    case 'slots':
      return 1000.0; // Max bonus multiplier
    case 'plinko':
      return 1000.0; // Max high risk multiplier
    case 'wheel':
      return 50.0; // Max multiplier on high risk
    case 'limbo':
      if (payload && typeof payload.targetMultiplier === 'number') {
        return Math.min(payload.targetMultiplier, 10000.0);
      }
      return 1000.0;
    case 'keno':
      return 10000.0; // 10/10 matches pays 10000x
    case 'mines':
      return 5000.0; // Theoretical max multiplier for high mines count
    case 'dragontower':
    case 'dragon-tower':
      return 3000.0; // High risk top tier multiplier
    case 'hilo':
      return 1000.0;
    default:
      return 100.0; // Fallback
  }
}

// Fetch aggregate potential exposure for currently active/open rounds of multi-step games
export async function getActiveRoundsExposure(gameId?: string): Promise<number> {
  let exposure = 0;

  // 1. Mines Active Exposure
  if (!gameId || gameId.toLowerCase() === 'mines') {
    const activeMines = await prisma.minesRound.findMany({
      where: { status: 'active' },
      select: { betAmount: true, revealedTiles: true, mineCount: true },
    });
    // We approximate exposure as betAmount * currentMultiplier
    activeMines.forEach((round) => {
      // Calculate current multiplier (simplified or use standard formula)
      let prob = 1;
      let count = 0;
      try {
        const revealed = JSON.parse(round.revealedTiles) as unknown[];
        count = Array.isArray(revealed) ? revealed.length : 0;
      } catch {
        count = 0;
      }
      const mines = round.mineCount;
      for (let i = 0; i < count; i++) {
        prob *= (25 - mines - i) / (25 - i);
      }
      const mult = count === 0 ? 1 : Math.round((1 / prob) * 0.99 * 100) / 100;
      exposure += Number(round.betAmount) * mult;
    });
  }

  // 2. Blackjack Active Exposure
  if (!gameId || gameId.toLowerCase() === 'blackjack') {
    const activeBlackjack = await prisma.blackjackRound.findMany({
      where: { status: { in: ['player_turn', 'dealer_turn'] } },
      select: { betAmount: true },
    });
    activeBlackjack.forEach((round) => {
      exposure += Number(round.betAmount) * 2.5; // Max theoretical payout (BJ pays 3:2, double down, splits)
    });
  }

  // 3. HiLo Active Exposure
  if (!gameId || gameId.toLowerCase() === 'hilo') {
    const activeHiLo = await prisma.hiLoRound.findMany({
      where: { status: 'active' },
      select: { betAmount: true, currentMultiplier: true },
    });
    activeHiLo.forEach((round) => {
      exposure += Number(round.betAmount) * Number(round.currentMultiplier);
    });
  }

  // 4. Dragon Tower Active Exposure
  if (!gameId || gameId.toLowerCase() === 'dragontower' || gameId.toLowerCase() === 'dragon-tower') {
    const activeDT = await prisma.dragonTowerRound.findMany({
      where: { status: 'active' },
      select: { betAmount: true, currentMultiplier: true },
    });
    activeDT.forEach((round) => {
      exposure += Number(round.betAmount) * Number(round.currentMultiplier);
    });
  }

  return exposure;
}

// Check liquidity constraints before accepting a bet
// Returns { allowed: boolean; reason?: string }
export async function validateBetLiquidity(params: {
  gameId: string;
  betAmount: number;
  payload?: any;
}): Promise<{ allowed: boolean; reason?: string; isGameCap?: boolean }> {
  const { gameId, betAmount, payload } = params;

  // Retrieve env variables or defaults
  const maxExposurePct = Number(process.env.MAX_EXPOSURE_PCT || '0.10'); // 10% pool limit per bet
  const maxGameExposurePct = Number(process.env.MAX_GAME_EXPOSURE_PCT || '0.30'); // 30% aggregate limit per game
  
  const pool = await getHousePool();

  // 1. Check global platform circuit breaker
  if (pool.platformPaused) {
    return { allowed: false, reason: 'Platform is temporarily closed for maintenance.' };
  }

  const maxMult = getMaxMultiplier(gameId, payload);
  const maxTheoreticalPayout = betAmount * maxMult;

  // 2. Max bet limit relative to pool
  if (maxTheoreticalPayout > pool.totalLiquidity * maxExposurePct) {
    return { 
      allowed: false, 
      reason: `Bet exceeds current table limit. Max theoretical payout of ₹${maxTheoreticalPayout.toLocaleString()} exceeds threshold.` 
    };
  }

  // 3. Per-game aggregate exposure limit
  const gameActiveExposure = await getActiveRoundsExposure(gameId);
  const nextGameExposure = gameActiveExposure + maxTheoreticalPayout;
  if (nextGameExposure > pool.totalLiquidity * maxGameExposurePct) {
    return { 
      allowed: false, 
      isGameCap: true,
      reason: 'Table temporarily at capacity, try another game.' 
    };
  }

  return { allowed: true };
}

// Adjusts liquidity, updates exposure, and triggers the auto-pause circuit breaker if needed
export async function adjustPoolLiquidity(amountChange: number, tx?: Prisma.TransactionClient) {
  const db = tx || prisma;
  
  // Fetch house pool
  const poolRecord = await db.housePool.findUnique({
    where: { id: 'global' },
  });

  if (!poolRecord) {
    // If it doesn't exist, retrieve creates it
    await getHousePool(db);
    return;
  }

  const nextLiquidity = Number(poolRecord.totalLiquidity) + amountChange;
  const floorThreshold = Number(poolRecord.baselineLiquidity) * 0.10; // 10% of starting value

  const triggerPause = nextLiquidity < floorThreshold;

  await db.housePool.update({
    where: { id: 'global' },
    data: {
      totalLiquidity: nextLiquidity,
      platformPaused: poolRecord.platformPaused || triggerPause,
    },
  });

  if (triggerPause && !poolRecord.platformPaused) {
    console.warn(`[CIRCUIT BREAKER] House liquidity pool dropped below floor. Pausing platform. Current Liquidity: ${nextLiquidity}, Baseline: ${poolRecord.baselineLiquidity}`);
  }
}

// Update current overall potential exposure in the database
export async function syncGlobalExposure() {
  const overallExposure = await getActiveRoundsExposure();
  await prisma.housePool.update({
    where: { id: 'global' },
    data: {
      currentExposure: overallExposure,
    },
  });
}
