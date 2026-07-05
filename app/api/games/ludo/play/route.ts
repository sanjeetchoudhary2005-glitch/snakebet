import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { rollLudoDice, calculateLudoPayout } from '@/lib/games/ludo'
import { generateServerSeed } from '@/lib/games/rng'
import { placeBet, creditPayout } from '@/lib/wallet'
import { validateBet } from '@/lib/games/validator'
import { enforceBetRateLimit } from '@/lib/rateLimit'

const schema = z.object({
  betAmount: z.number().positive(),
  clientSeed: z.string().min(1).max(64),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id
    const limited = await enforceBetRateLimit(userId, 'ludo:play')
    if (limited) return limited

    const body = schema.parse(await req.json())
    await validateBet(userId, body.betAmount)

    const serverSeed = generateServerSeed()
    const nonce = Date.now()

    // Determine winner deterministically (e.g. using a roll value)
    const roll = rollLudoDice(serverSeed, body.clientSeed, nonce)
    const won = roll > 3 // 4, 5, 6 is win, 1, 2, 3 is loss (50% probability)

    const pot = body.betAmount * 2
    const payout = won ? calculateLudoPayout(pot) : 0
    const matchId = `ludo-${nonce}`

    const result = await prisma.$transaction(async (tx) => {
      await placeBet({ userId, gameId: 'ludo', amount: body.betAmount, roundId: matchId }, tx)
      if (won) {
        await creditPayout({ userId, gameId: 'ludo', roundId: matchId, payout }, tx)
      }

      const match = await tx.ludoMatch.create({
        data: {
          id: matchId,
          status: 'completed',
          betAmount: body.betAmount,
          maxPlayers: 2,
          winnerId: won ? userId : 'opponent_bot',
          serverSeed,
        }
      })

      await tx.ludoPlayer.createMany({
        data: [
          { matchId, userId, color: 'red', position: JSON.stringify([58, 58, 58, 58]) },
          { matchId, userId: 'opponent_bot', color: 'blue', position: JSON.stringify([58, 58, 58, 58]) }
        ]
      })

      return match
    })

    return NextResponse.json({
      matchId: result.id,
      won,
      payout,
      roll,
      serverSeedHash: result.serverSeed,
      nonce,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
