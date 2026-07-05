import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { drawKenoBalls, evaluateKeno } from '@/lib/games/keno'
import { generateServerSeed, hashServerSeed } from '@/lib/games/rng'
import { placeBet, creditPayout } from '@/lib/wallet'
import { validateBet } from '@/lib/games/validator'
import { enforceBetRateLimit } from '@/lib/rateLimit'

const schema = z.object({
  betAmount: z.number().positive(),
  pickedNumbers: z.array(z.number().int().min(1).max(80)).min(1).max(10),
  clientSeed: z.string().min(1).max(64),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id
    const limited = await enforceBetRateLimit(userId, 'keno:play')
    if (limited) return limited

    const body = schema.parse(await req.json())
    await validateBet(userId, body.betAmount)

    const serverSeed = generateServerSeed()
    const serverSeedHash = hashServerSeed(serverSeed)
    const nonce = Date.now()

    const drawn = drawKenoBalls(serverSeed, body.clientSeed, nonce)
    const { matches, multiplier, payout } = evaluateKeno(body.pickedNumbers, drawn, body.betAmount)
    const roundId = `keno-${nonce}`

    const round = await prisma.$transaction(async (tx) => {
      await placeBet({ userId, gameId: 'keno', amount: body.betAmount, roundId }, tx)
      if (payout > 0) {
        await creditPayout({ userId, gameId: 'keno', roundId, payout }, tx)
      }

      return tx.kenoRound.create({
        data: {
          userId,
          betAmount: body.betAmount,
          pickedNumbers: JSON.stringify(body.pickedNumbers),
          drawnNumbers: JSON.stringify(drawn),
          matchCount: matches,
          multiplier,
          serverSeed,
          serverSeedHash,
          clientSeed: body.clientSeed,
          nonce: BigInt(nonce),
        }
      })
    })

    return NextResponse.json({
      drawn,
      matches,
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
