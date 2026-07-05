import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { dropBall, getPlinkoMultiplier } from '@/lib/games/plinko'
import { generateServerSeed, hashServerSeed } from '@/lib/games/rng'
import { placeBet, creditPayout } from '@/lib/wallet'
import { validateBet } from '@/lib/games/validator'
import { enforceBetRateLimit } from '@/lib/rateLimit'

const schema = z.object({
  betAmount: z.number().positive(),
  rows: z.union([z.literal(8), z.literal(12), z.literal(16)]),
  riskLevel: z.enum(['low', 'medium', 'high']),
  clientSeed: z.string().min(1).max(64),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id
    const limited = await enforceBetRateLimit(userId, 'plinko:play')
    if (limited) return limited

    const body = schema.parse(await req.json())
    await validateBet(userId, body.betAmount)

    const serverSeed = generateServerSeed()
    const serverSeedHash = hashServerSeed(serverSeed)
    const nonce = Date.now()
    const { path, bucket } = dropBall(serverSeed, body.clientSeed, nonce, body.rows)
    const multiplier = getPlinkoMultiplier(bucket, body.rows, body.riskLevel)
    const payout = parseFloat((body.betAmount * multiplier).toFixed(2))
    const roundId = `plinko-${nonce}`

    let newBalance = 0

    const round = await prisma.$transaction(async (tx) => {
      const { user: afterBetUser } = await placeBet({ userId, gameId: 'plinko', amount: body.betAmount, roundId }, tx)
      
      let afterPayoutUser = afterBetUser
      if (payout > 0) {
        const { user } = await creditPayout({ userId, gameId: 'plinko', roundId, payout }, tx)
        afterPayoutUser = user
      }
      
      newBalance = Number(afterPayoutUser.balance)

      return tx.plinkoRound.create({
        data: {
          userId,
          betAmount: body.betAmount,
          rows: body.rows,
          riskLevel: body.riskLevel,
          path: JSON.stringify(path.split('')),
          bucketIndex: bucket,
          multiplier,
          serverSeed,
          serverSeedHash,
          clientSeed: body.clientSeed,
          nonce: BigInt(nonce),
        }
      })
    })

    return NextResponse.json({
      path: path.split(''),
      bucketIndex: bucket,
      multiplier,
      won: payout > 0,
      payout,
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
