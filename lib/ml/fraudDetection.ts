import { prisma } from '@/lib/prisma'

interface FraudSignals {
  rapidBetting: boolean
  unusualWinRate: boolean
  multiAccount: boolean
  depositWithdrawLoop: boolean
  riskScore: number
}

export async function analyzeFraudSignals(userId: string): Promise<FraudSignals> {
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  // Signal 1: Rapid betting (>30 bets in 5 minutes)
  const recentBetCount = await prisma.transaction.count({
    where: { userId, type: 'BET', createdAt: { gte: fiveMinAgo } }
  })
  const rapidBetting = recentBetCount > 30

  // Signal 2: Unusual win rate (>65% over last 100 bets — theoretical max ~50%)
  const last100 = await prisma.transaction.findMany({
    where: { userId, type: { in: ['BET', 'WIN'] }, createdAt: { gte: oneDayAgo } },
    orderBy: { createdAt: 'desc' },
    take: 200
  })
  const bets = last100.filter(t => t.type === 'BET').length
  const wins = last100.filter(t => t.type === 'WIN').length
  const winRate = bets > 0 ? wins / bets : 0
  const unusualWinRate = bets >= 20 && winRate > 0.65

  // Signal 3: Deposit→bet→withdraw loop (suspicious pattern)
  const deposits = await prisma.transaction.count({
    where: { userId, type: 'DEPOSIT', createdAt: { gte: oneDayAgo } }
  })
  const withdrawals = await prisma.transaction.count({
    where: { userId, type: { in: ['WITHDRAWAL_PENDING', 'WITHDRAWAL_COMPLETED'] }, createdAt: { gte: oneDayAgo } }
  })
  const depositWithdrawLoop = deposits >= 3 && withdrawals >= 3

  // Calculate risk score (0-100)
  let riskScore = 0
  if (rapidBetting) riskScore += 40
  if (unusualWinRate) riskScore += 35
  if (depositWithdrawLoop) riskScore += 25

  // Auto-flag in DB if risk score >= 60
  if (riskScore >= 60) {
    await prisma.securityLog.create({
      data: {
        userId,
        event: 'SUSPICIOUS',
        details: JSON.stringify({ rapidBetting, unusualWinRate, depositWithdrawLoop, riskScore }),
      }
    }).catch(() => {}) // don't throw if logging fails
  }

  return { rapidBetting, unusualWinRate, multiAccount: false, depositWithdrawLoop, riskScore }
}
