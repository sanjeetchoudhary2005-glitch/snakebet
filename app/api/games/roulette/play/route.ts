import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { spinRoulette, evaluateBet } from '@/lib/games/roulette'
import { generateServerSeed, hashServerSeed } from '@/lib/games/rng'
import { placeBet, creditPayout } from '@/lib/wallet'
import { validateBet } from '@/lib/games/validator'
import { enforceBetRateLimit } from '@/lib/rateLimit'

const betItemSchema = z.object({
  type: z.string(),
  value: z.any().optional(),
  amount: z.number().positive(),
})

const schema = z.object({
  betAmount: z.number().positive(),
  bets: z.array(betItemSchema).min(1),
  clientSeed: z.string().min(1).max(64),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id
    const limited = await enforceBetRateLimit(userId, 'roulette:play')
    if (limited) return limited

    const body = schema.parse(await req.json())
    await validateBet(userId, body.betAmount)

    // Ensure total amount in bets matches betAmount
    const totalBetsAmount = body.bets.reduce((sum, b) => sum + b.amount, 0)
    if (Math.abs(totalBetsAmount - body.betAmount) > 0.01) {
      return NextResponse.json({ error: 'Total bets amount must equal betAmount' }, { status: 400 })
    }

    const serverSeed = generateServerSeed()
    const serverSeedHash = hashServerSeed(serverSeed)
    const nonce = Date.now()

    const rouletteResult = spinRoulette(serverSeed, body.clientSeed, nonce)

    let totalPayout = 0
    const betResults = body.bets.map(bet => {
      const { won, payout } = evaluateBet(bet.type, bet.value, rouletteResult, bet.amount)
      totalPayout += payout
      return { ...bet, won, payout }
    })

    const payout = parseFloat(totalPayout.toFixed(2))
    const roundId = `roulette-${nonce}`

    const round = await prisma.$transaction(async (tx) => {
      await placeBet({ userId, gameId: 'roulette', amount: body.betAmount, roundId }, tx)
      if (payout > 0) {
        await creditPayout({ userId, gameId: 'roulette', roundId, payout }, tx)
      }

      return tx.rouletteRound.create({
        data: {
          userId,
          betAmount: body.betAmount,
          bets: JSON.stringify(betResults),
          result: rouletteResult,
          payout,
          serverSeed,
          serverSeedHash,
          clientSeed: body.clientSeed,
          nonce: BigInt(nonce),
        }
      })
    })

    return NextResponse.json({
      result: rouletteResult,
      betResults,
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
