
import { prisma } from './prisma';
import { Prisma } from '@prisma/client';
import { logger } from './logger';
import { validateBetLiquidity, adjustPoolLiquidity } from './liquidity';
import { updateVipOnBet } from './vip';
import { broadcastActivityEvent } from './live-activity';

// Define game configs for min/max bets
const GAME_CONFIGS: Record<string, { minBet: number; maxBet: number }> = {
  ludo: { minBet: 50, maxBet: 10000 },
  mines: { minBet: 10, maxBet: 50000 },
  crash: { minBet: 10, maxBet: 100000 },
  plinko: { minBet: 10, maxBet: 50000 },
  slots: { minBet: 10, maxBet: 25000 },
  dice: { minBet: 10, maxBet: 50000 },
  coinflip: { minBet: 10, maxBet: 50000 },
  wheel: { minBet: 10, maxBet: 50000 },
  hilo: { minBet: 10, maxBet: 50000 },
  keno: { minBet: 10, maxBet: 50000 },
  dragontower: { minBet: 10, maxBet: 50000 },
  roulette: { minBet: 10, maxBet: 100000 },
  blackjack: { minBet: 50, maxBet: 100000 },
  'andar-bahar': { minBet: 10, maxBet: 50000 },
  baccarat: { minBet: 50, maxBet: 100000 },
  'teen-patti': { minBet: 10, maxBet: 50000 },
  dragontiger: { minBet: 10, maxBet: 50000 },
  limbo: { minBet: 10, maxBet: 50000 },
};

// Get user balance (always server-side, never trust client)
export async function getBalance(userId: string): Promise<Prisma.Decimal> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balance: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user.balance;
}

// Helper to get tx (fallback to prisma if not provided)
function getTx(tx?: Prisma.TransactionClient) {
  return tx || prisma;
}

function toDecimal(amount: number | Prisma.Decimal): Prisma.Decimal {
  return amount instanceof Prisma.Decimal ? amount : new Prisma.Decimal(amount);
}

// Place a bet: deducts amount, records transaction (in transaction!)
export async function placeBet(params: {
  userId: string;
  gameId: string;
  roundId?: string;
  amount: number;
}, tx?: Prisma.TransactionClient) {
  const db = getTx(tx);
  const { userId, gameId, roundId, amount } = params;

  // Validate game config
  const config = GAME_CONFIGS[gameId.toLowerCase()] || { minBet: 10, maxBet: 100000 };
  if (amount <= 0) {
    throw new Error('Bet amount must be greater than 0');
  }
  if (amount < config.minBet) {
    throw new Error(`Minimum bet for this game is ${config.minBet}`);
  }
  if (amount > config.maxBet) {
    throw new Error(`Maximum bet for this game is ${config.maxBet}`);
  }

  const amountDecimal = toDecimal(amount);

  const activeExclusion = await db.selfExclusion.findFirst({
    where: {
      userId,
      OR: [
        { until: null },
        { until: { gt: new Date() } },
      ],
    },
    select: { until: true },
    orderBy: { createdAt: 'desc' },
  });

  if (activeExclusion) {
    throw new Error(
      activeExclusion.until
        ? `Self-exclusion active until ${activeExclusion.until.toISOString()}`
        : 'Permanent self-exclusion active'
    );
  }

  // Validate house pool liquidity limits
  const check = await validateBetLiquidity({ gameId, betAmount: amount });
  if (!check.allowed) {
    throw new Error(check.reason || 'Bet exceeds current table limit.');
  }

  // Increment house pool liquidity by bet amount
  await adjustPoolLiquidity(amount, db);

  // Guarded write prevents concurrent requests from driving balance below zero.
  const debit = await db.user.updateMany({
    where: {
      id: userId,
      balance: { gte: amountDecimal },
    },
    data: {
      balance: { decrement: amountDecimal },
    },
  });

  if (debit.count !== 1) {
    const userExists = await db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    throw new Error(userExists ? 'Insufficient balance' : 'User not found');
  }

  const updatedUser = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, balance: true },
  });
  const balanceBefore = new Prisma.Decimal(updatedUser.balance).plus(amountDecimal);

  // Record transaction
  const transaction = await db.transaction.create({
    data: {
      userId: updatedUser.id,
      type: 'BET',
      amount: amountDecimal,
      balanceBefore,
      balanceAfter: updatedUser.balance,
      gameId: gameId,
      roundId: roundId || null,
      status: 'completed',
    },
  });

  await updateVipOnBet(userId, amount, db);

  const userMeta = await db.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });

  logger.info('wallet_bet_placed', {
    userId,
    gameId,
    roundId,
    amount,
    balanceAfter: updatedUser.balance.toString(),
  });

  if (userMeta?.username) {
    void broadcastActivityEvent({
      username: userMeta.username,
      gameId,
      amount,
      eventType: 'bet',
    });
  }

  return {
    transaction,
    user: updatedUser,
  };
}

// Credit a payout: adds payout, records transaction
export async function creditPayout(params: {
  userId: string;
  gameId: string;
  roundId?: string;
  payout: number; // always recompute server-side!
}, tx?: Prisma.TransactionClient) {
  const db = getTx(tx);
  const { userId, gameId, roundId, payout } = params;

  if (payout < 0) {
    throw new Error('Payout cannot be negative');
  }
  if (payout === 0) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, balance: true },
    });
    if (!user) throw new Error('User not found');
    return { transaction: null, user };
  }

  const payoutDecimal = toDecimal(payout);

  // Decrement house pool liquidity by payout amount
  await adjustPoolLiquidity(-payout, db);

  const updatedUser = await db.user.update({
    where: { id: userId },
    data: {
      balance: { increment: payoutDecimal },
      totalWon: { increment: payoutDecimal },
    },
    select: { id: true, balance: true, totalWon: true },
  });
  const balanceBefore = new Prisma.Decimal(updatedUser.balance).minus(payoutDecimal);

  const transaction = await db.transaction.create({
    data: {
      userId: updatedUser.id,
      type: 'WIN',
      amount: payoutDecimal,
      balanceBefore,
      balanceAfter: updatedUser.balance,
      gameId: gameId,
      roundId: roundId || null,
      status: 'completed',
    },
  });

  logger.info('wallet_payout_credited', {
    userId,
    gameId,
    roundId,
    payout,
    balanceAfter: updatedUser.balance.toString(),
  });

  const userMeta = await db.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });

  if (userMeta?.username && payout > 0) {
    void broadcastActivityEvent({
      username: userMeta.username,
      gameId,
      amount: payout,
      eventType: 'win',
    });
  }

  return {
    transaction,
    user: updatedUser,
  };
}

export const settleBet = creditPayout;

export async function settleTeenPattiRound(winnerId: string, roundId: string, pot: number, tableBootAmount: number) {
  let rakePercent = 0.05;
  let rakeCap = 500;

  if (tableBootAmount >= 2000) {
    rakePercent = 0.03;
    rakeCap = 3000;
  } else if (tableBootAmount >= 500) {
    rakePercent = 0.04;
    rakeCap = 1500;
  } else if (tableBootAmount >= 100) {
    rakePercent = 0.05;
    rakeCap = 500;
  } else {
    rakePercent = 0.05;
    rakeCap = tableBootAmount * 10;
  }

  const rawRake = pot * rakePercent;
  const rake = Math.min(rawRake, rakeCap);
  const payout = pot - rake;

  if (payout <= 0) return null;

  const payoutDecimal = toDecimal(payout);
  const rakeDecimal = toDecimal(rake);

  await adjustPoolLiquidity(-payout, prisma);

  const updatedUser = await prisma.user.update({
    where: { id: winnerId },
    data: {
      balance: { increment: payoutDecimal },
      totalWon: { increment: payoutDecimal },
    },
    select: { id: true, balance: true, totalWon: true },
  });
  const balanceBefore = new Prisma.Decimal(updatedUser.balance).minus(payoutDecimal);

  const transaction = await prisma.transaction.create({
    data: {
      userId: updatedUser.id,
      type: 'WIN',
      amount: payoutDecimal,
      balanceBefore,
      balanceAfter: updatedUser.balance,
      gameId: 'teen-patti',
      roundId,
      status: 'completed',
    },
  });

  await prisma.houseRake.create({
    data: {
      gameType: 'TEEN_PATTI',
      amount: rakeDecimal,
      roundId,
    },
  });

  logger.info('teen_patti_settled', {
    userId: winnerId,
    roundId,
    pot,
    rake,
    payout,
    balanceAfter: updatedUser.balance.toString(),
  });

  const userMeta = await prisma.user.findUnique({
    where: { id: winnerId },
    select: { username: true },
  });

  if (userMeta?.username && payout > 0) {
    void broadcastActivityEvent({
      username: userMeta.username,
      gameId: 'teen-patti',
      amount: payout,
      eventType: 'win',
    });
  }

  return { transaction, user: updatedUser, rake, payout };
}
