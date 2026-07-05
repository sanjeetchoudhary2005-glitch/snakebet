import { prisma } from '@/lib/prisma'

export const GAME_LIMITS = {
  minBet: Number(process.env.MIN_BET ?? 10),
  maxBet: Number(process.env.MAX_BET ?? 100000),
}

export async function validateBet(userId: string, betAmount: number): Promise<void> {
  if (!Number.isFinite(betAmount) || betAmount < GAME_LIMITS.minBet) {
    throw new Error(`Minimum bet is ₹${GAME_LIMITS.minBet}`)
  }
  if (betAmount > GAME_LIMITS.maxBet) {
    throw new Error(`Maximum bet is ₹${GAME_LIMITS.maxBet}`)
  }
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { balance: true }
  })
  if (Number(user.balance) < betAmount) {
    throw new Error('Insufficient balance')
  }
}
