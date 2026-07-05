import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { playDragonTiger, getDragonTigerPayout } from '@/lib/games/dragontiger'
import { generateServerSeed, hashServerSeed } from '@/lib/games/rng'
import { placeBet, creditPayout } from '@/lib/wallet'
import { validateBet } from '@/lib/games/validator'
import { enforceBetRateLimit } from '@/lib/rateLimit'

const schema = z.object({
  betAmount: z.number().positive(),
  betType: z.enum(['dragon', 'tiger', 'tie']),
  clientSeed: z.string().min(1).max(64),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id
    const limited = await enforceBetRateLimit(userId, 'dragontiger:play')
    if (limited) return limited

    const body = schema.parse(await req.json())
    await validateBet(userId, body.betAmount)

    const serverSeed = generateServerSeed()
    const serverSeedHash = hashServerSeed(serverSeed)
    const nonce = Date.now()

    const outcome = playDragonTiger(serverSeed, body.clientSeed, nonce)
    const payout = getDragonTigerPayout(body.betType, outcome.winner, body.betAmount)
    const multiplier = payout / body.betAmount
    const roundId = `dragontiger-${nonce}`

    const round = await prisma.$transaction(async (tx) => {
      await placeBet({ userId, gameId: 'dragontiger', amount: body.betAmount, roundId }, tx)
      if (payout > 0) {
        await creditPayout({ userId, gameId: 'dragontiger', roundId, payout }, tx)
      }

      return tx.dragonTigerRound.create({
        data: {
          userId,
          betAmount: body.betAmount,
          betType: body.betType,
          dragonCard: JSON.stringify(outcome.dragonCard),
          tigerCard: JSON.stringify(outcome.tigerCard),
          winner: outcome.winner,
          multiplier,
          serverSeed,
          serverSeedHash,
          clientSeed: body.clientSeed,
          nonce: BigInt(nonce),
        }
      })
    })

    return NextResponse.json({
      dragonCard: outcome.dragonCard,
      tigerCard: outcome.tigerCard,
      winner: outcome.winner,
      multiplier,
      payout,
      won: payout > body.betAmount,
      serverSeedHash,
      clientSeed: body.clientSeed,
      nonce,
      roundId: round.id,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
