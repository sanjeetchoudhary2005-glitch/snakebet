import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { flipCoin, calculateCoinflipPayout, COINFLIP_MULTIPLIER } from '@/lib/games/coinflip'
import { generateServerSeed, hashServerSeed } from '@/lib/games/rng'
import { placeBet, creditPayout } from '@/lib/wallet'
import { validateBet } from '@/lib/games/validator'
import { enforceBetRateLimit } from '@/lib/rateLimit'

const schema = z.object({
  betAmount: z.number().positive(),
  choice: z.enum(['heads', 'tails']),
  clientSeed: z.string().min(1).max(64),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id
    const limited = await enforceBetRateLimit(userId, 'coinflip:play')
    if (limited) return limited

    const body = schema.parse(await req.json())
    await validateBet(userId, body.betAmount)

    const serverSeed = generateServerSeed()
    const serverSeedHash = hashServerSeed(serverSeed)
    const nonce = Date.now()
    const result = flipCoin(serverSeed, body.clientSeed, nonce)
    const payout = calculateCoinflipPayout(body.betAmount, body.choice, result)
    const won = payout > 0
    const roundId = `coinflip-${nonce}`

    let newBalance = 0

    const round = await prisma.$transaction(async (tx) => {
      const { user: afterBetUser } = await placeBet({ userId, gameId: 'coinflip', amount: body.betAmount, roundId }, tx)
      
      let afterPayoutUser = afterBetUser
      if (won) {
        const { user } = await creditPayout({ userId, gameId: 'coinflip', roundId, payout }, tx)
        afterPayoutUser = user
      }
      
      newBalance = Number(afterPayoutUser.balance)

      return tx.coinFlipRound.create({
        data: {
          userId,
          betAmount: body.betAmount,
          choice: body.choice,
          result,
          won,
          payout,
          serverSeed,
          serverSeedHash,
          clientSeed: body.clientSeed,
          nonce: BigInt(nonce),
        }
      })
    })

    return NextResponse.json({
      result,
      won,
      payout,
      multiplier: won ? COINFLIP_MULTIPLIER : 0,
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
