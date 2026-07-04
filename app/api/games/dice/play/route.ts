import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { rollDice, calculateDicePayout, didWinDice } from '@/lib/games/dice'
import { generateServerSeed, hashServerSeed } from '@/lib/games/rng'
import { placeBet, creditPayout } from '@/lib/wallet'
import { validateBet } from '@/lib/games/validator'
import { enforceBetRateLimit } from '@/lib/rateLimit'

const schema = z.object({
  betAmount: z.number().positive(),
  target: z.number().min(2).max(98),
  direction: z.enum(['over', 'under']),
  clientSeed: z.string().min(1).max(64),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id
    const limited = await enforceBetRateLimit(userId, 'dice:play')
    if (limited) return limited

    const body = schema.parse(await req.json())
    await validateBet(userId, body.betAmount)

    const serverSeed = generateServerSeed()
    const serverSeedHash = hashServerSeed(serverSeed)
    const nonce = Date.now()
    const { multiplier, winChance } = calculateDicePayout(body.betAmount, body.target, body.direction)
    const roll = rollDice(serverSeed, body.clientSeed, nonce)
    const won = didWinDice(roll, body.target, body.direction)
    const payout = won ? parseFloat((body.betAmount * multiplier).toFixed(2)) : 0
    const roundId = `dice-${nonce}`

    let newBalance = 0

    const round = await prisma.$transaction(async (tx) => {
      const { user: afterBetUser } = await placeBet({ userId, gameId: 'dice', amount: body.betAmount, roundId }, tx)
      
      let afterPayoutUser = afterBetUser
      if (won) {
        const { user } = await creditPayout({ userId, gameId: 'dice', roundId, payout }, tx)
        afterPayoutUser = user
      }
      
      newBalance = Number(afterPayoutUser.balance)

      return tx.diceRound.create({
        data: {
          userId,
          betAmount: body.betAmount,
          target: body.target,
          direction: body.direction,
          roll,
          won,
          payout,
          serverSeed,
          clientSeed: body.clientSeed,
          nonce: BigInt(nonce),
        }
      })
    })

    return NextResponse.json({
      roll,
      won,
      payout,
      multiplier,
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
