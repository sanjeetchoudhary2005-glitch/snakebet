import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { playAndarBahar, getAndarBaharPayout } from '@/lib/games/andarbahar'
import { generateServerSeed, hashServerSeed } from '@/lib/games/rng'
import { placeBet, creditPayout } from '@/lib/wallet'
import { validateBet } from '@/lib/games/validator'
import { enforceBetRateLimit } from '@/lib/rateLimit'

const schema = z.object({
  betAmount: z.number().positive(),
  side: z.enum(['andar', 'bahar']),
  clientSeed: z.string().min(1).max(64),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id
    const limited = await enforceBetRateLimit(userId, 'andar-bahar:play')
    if (limited) return limited

    const body = schema.parse(await req.json())
    await validateBet(userId, body.betAmount)

    const serverSeed = generateServerSeed()
    const serverSeedHash = hashServerSeed(serverSeed)
    const nonce = Date.now()

    const outcome = playAndarBahar(serverSeed, body.clientSeed, nonce)
    const payout = getAndarBaharPayout(body.side, outcome.winner, body.betAmount)
    const multiplier = payout / body.betAmount
    const roundId = `andar-bahar-${nonce}`

    let newBalance = 0

    const round = await prisma.$transaction(async (tx) => {
      const { user: afterBetUser } = await placeBet({ userId, gameId: 'andar-bahar', amount: body.betAmount, roundId }, tx)
      
      let afterPayoutUser = afterBetUser
      if (payout > 0) {
        const { user } = await creditPayout({ userId, gameId: 'andar-bahar', roundId, payout }, tx)
        afterPayoutUser = user
      }
      
      newBalance = Number(afterPayoutUser.balance)

      return tx.andarBaharRound.create({
        data: {
          userId,
          betAmount: body.betAmount,
          side: body.side,
          jokerCard: JSON.stringify(outcome.jokerCard),
          dealtCards: JSON.stringify({ andar: outcome.andarCards, bahar: outcome.baharCards }),
          winningSide: outcome.winner,
          matchIndex: outcome.totalCards,
          multiplier,
          serverSeed,
          serverSeedHash,
          clientSeed: body.clientSeed,
          nonce: BigInt(nonce),
        }
      })
    })

    return NextResponse.json({
      jokerCard: outcome.jokerCard,
      dealtCards: { andar: outcome.andarCards, bahar: outcome.baharCards },
      winningSide: outcome.winner,
      matchIndex: outcome.totalCards,
      multiplier,
      payout,
      won: payout > 0,
      serverSeedHash,
      clientSeed: body.clientSeed,
      nonce,
      roundId: round.id,
      newBalance,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
