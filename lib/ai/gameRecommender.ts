import { prisma } from '@/lib/prisma'

// Collaborative filtering — recommend games based on play history patterns
export async function getGameRecommendations(userId: string): Promise<string[]> {
  // Get user's game history
  const userHistory = await prisma.transaction.groupBy({
    by: ['gameId'], // Use gameId as standard column in schema
    where: { userId, type: 'BET', gameId: { not: null } },
    _count: { gameId: true },
    _sum: { amount: true },
    orderBy: { _count: { gameId: 'desc' } }
  })

  const playedGames = userHistory.map(h => h.gameId!).filter(Boolean)
  const allGames = ['crash', 'mines', 'dice', 'plinko', 'coinflip', 'hilo', 'wheel',
                    'roulette', 'blackjack', 'baccarat', 'andar-bahar', 'teen-patti',
                    'dragon-tiger', 'slots', 'ludo']

  // Find similar users (played same games)
  const similarUsers = await prisma.transaction.groupBy({
    by: ['userId'],
    where: {
      gameId: { in: playedGames },
      type: 'BET',
      userId: { not: userId }
    },
    _count: { gameId: true },
    orderBy: { _count: { gameId: 'desc' } },
    take: 20
  })

  // Find what similar users play that this user doesn't
  const similarUserIds = similarUsers.map(u => u.userId)
  const recommendations = await prisma.transaction.groupBy({
    by: ['gameId'],
    where: {
      userId: { in: similarUserIds },
      gameId: { notIn: playedGames, not: null },
      type: 'BET',
    },
    _count: { gameId: true },
    orderBy: { _count: { gameId: 'desc' } },
    take: 5
  })

  const recGames = recommendations.map(r => r.gameId!).filter(Boolean)

  // Fill with unplayed popular games if not enough recommendations
  const unplayed = allGames.filter(g => !playedGames.includes(g) && !recGames.includes(g))
  return [...recGames, ...unplayed].slice(0, 5)
}

// Churn prediction — simple rule-based ML
export async function getChurnRisk(userId: string): Promise<'low' | 'medium' | 'high'> {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const recentBets = await prisma.transaction.count({
    where: { userId, type: 'BET', createdAt: { gte: threeDaysAgo } }
  })

  const weekBets = await prisma.transaction.count({
    where: { userId, type: 'BET', createdAt: { gte: sevenDaysAgo } }
  })

  if (recentBets === 0 && weekBets > 10) return 'high'    // was active, stopped
  if (recentBets < 3 && weekBets > 5) return 'medium'     // slowing down
  return 'low'
}

// Personalized bet suggestion based on user's history
export async function getSuggestedBetAmount(userId: string, gameId: string): Promise<number> {
  const avgBet = await prisma.transaction.aggregate({
    where: { userId, type: 'BET', gameId },
    _avg: { amount: true }
  })
  return Number(avgBet._avg.amount ?? 100)
}
