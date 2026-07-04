import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { shuffleDeck } from '@/lib/games/rng'
import { playBaccarat, getBaccaratPayout } from '@/lib/games/baccarat'
import { generateServerSeed, hashServerSeed } from '@/lib/games/rng'
import { placeBet, creditPayout } from '@/lib/wallet'
import { validateBet } from '@/lib/games/validator'
import { enforceBetRateLimit } from '@/lib/rateLimit'

const schema = z.object({
  betAmount: z.number().positive(),
  betType: z.enum(['player', 'banker', 'tie']),
  clientSeed: z.string().min(1).max(64),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id
    const limited = await enforceBetRateLimit(userId, 'baccarat:play')
    if (limited) return limited

    const body = schema.parse(await req.json())
    await validateBet(userId, body.betAmount)

    const serverSeed = generateServerSeed()
    const serverSeedHash = hashServerSeed(serverSeed)
    const nonce = Date.now()

    const deck = shuffleDeck(serverSeed, body.clientSeed, nonce)
    const outcome = playBaccarat(deck)
    const payout = getBaccaratPayout(body.betType, outcome.winner, body.betAmount)
    const multiplier = payout / body.betAmount
    const roundId = `baccarat-${nonce}`

    const round = await prisma.$transaction(async (tx) => {
      await placeBet({ userId, gameId: 'baccarat', amount: body.betAmount, roundId }, tx)
      if (payout > 0) {
        await creditPayout({ userId, gameId: 'baccarat', roundId, payout }, tx)
      }

      return tx.baccaratRound.create({
        data: {
          userId,
          betAmount: body.betAmount,
          betType: body.betType,
          playerCards: JSON.stringify(outcome.playerHand),
          bankerCards: JSON.stringify(outcome.bankerHand),
          playerTotal: outcome.playerTotal,
          bankerTotal: outcome.bankerTotal,
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
      playerHand: outcome.playerHand,
      bankerHand: outcome.bankerHand,
      playerTotal: outcome.playerTotal,
      bankerTotal: outcome.bankerTotal,
      winner: outcome.winner,
      multiplier,
      payout,
      won: payout > body.betAmount, // standard push gives stake back, not net win
      serverSeedHash,
      clientSeed: body.clientSeed,
      nonce,
      roundId: round.id,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
