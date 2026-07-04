import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { playTeenPatti, getTeenPattiPayout, evaluateTeenPattiHand, HAND_NAMES } from '@/lib/games/teenpatti'
import { generateServerSeed, hashServerSeed } from '@/lib/games/rng'
import { placeBet, creditPayout } from '@/lib/wallet'
import { validateBet } from '@/lib/games/validator'
import { enforceBetRateLimit } from '@/lib/rateLimit'

const schema = z.object({
  betAmount: z.number().positive(),
  betOnPlayer: z.boolean().default(true),
  clientSeed: z.string().min(1).max(64),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id
    const limited = await enforceBetRateLimit(userId, 'teen-patti:play')
    if (limited) return limited

    const body = schema.parse(await req.json())
    await validateBet(userId, body.betAmount)

    const serverSeed = generateServerSeed()
    const serverSeedHash = hashServerSeed(serverSeed)
    const nonce = Date.now()

    const outcome = playTeenPatti(serverSeed, body.clientSeed, nonce)
    const payout = getTeenPattiPayout(body.betOnPlayer, outcome.winner, body.betAmount)
    const multiplier = payout / body.betAmount
    const playerEvaluation = evaluateTeenPattiHand(outcome.playerHand)
    const handRankName = HAND_NAMES[playerEvaluation.rank]
    const roundId = `teen-patti-${nonce}`

    const round = await prisma.$transaction(async (tx) => {
      await placeBet({ userId, gameId: 'teen-patti', amount: body.betAmount, roundId }, tx)
      if (payout > 0) {
        await creditPayout({ userId, gameId: 'teen-patti', roundId, payout }, tx)
      }

      return tx.teenPattiRound.create({
        data: {
          userId,
          betAmount: body.betAmount,
          cards: JSON.stringify({ player: outcome.playerHand, dealer: outcome.dealerHand }),
          handRank: handRankName,
          multiplier,
          serverSeed,
          serverSeedHash,
          clientSeed: body.clientSeed,
          nonce: BigInt(nonce),
        }
      })
    })

    return NextResponse.json({
      playerHand: outcome.playerHand,
      dealerHand: outcome.dealerHand,
      winner: outcome.winner,
      handRank: handRankName,
      multiplier,
      payout,
      won: payout > 0,
      serverSeedHash,
      clientSeed: body.clientSeed,
      nonce,
      roundId: round.id,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
