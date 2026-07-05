import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { startHiLoGame, getHiLoOdds } from '@/lib/games/hilo'
import { generateServerSeed, hashServerSeed, cardFromIndex } from '@/lib/games/rng'
import { placeBet, creditPayout } from '@/lib/wallet'
import { validateBet } from '@/lib/games/validator'
import { enforceBetRateLimit } from '@/lib/rateLimit'

const schema = z.object({
  action: z.enum(['start', 'guess', 'cashout']),
  betAmount: z.number().positive().optional(),
  clientSeed: z.string().min(1).max(64).optional(),
  prediction: z.enum(['higher', 'lower', 'equal']).optional(),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id
    const limited = await enforceBetRateLimit(userId, 'hilo:play')
    if (limited) return limited

    const body = schema.parse(await req.json())

    if (body.action === 'start') {
      if (!body.betAmount || !body.clientSeed) {
        return NextResponse.json({ error: 'betAmount and clientSeed are required to start' }, { status: 400 })
      }
      await validateBet(userId, body.betAmount)

      // Check if there is already an active game
      const existing = await prisma.hiLoRound.findFirst({
        where: { userId, status: 'active' }
      })
      if (existing) {
        return NextResponse.json({ error: 'An active HiLo game already exists. Cashout or complete it first.' }, { status: 400 })
      }

      const serverSeed = generateServerSeed()
      const serverSeedHash = hashServerSeed(serverSeed)
      const nonce = Date.now()
      const game = startHiLoGame(serverSeed, body.clientSeed, nonce)
      const roundId = `hilo-${nonce}`

      const round = await prisma.$transaction(async (tx) => {
        await placeBet({ userId, gameId: 'hilo', amount: body.betAmount!, roundId }, tx)
        return tx.hiLoRound.create({
          data: {
            userId,
            betAmount: body.betAmount!,
            deck: JSON.stringify(game.deck),
            currentIndex: 0,
            currentMultiplier: 1.0,
            status: 'active',
            serverSeed,
            serverSeedHash,
            clientSeed: body.clientSeed!,
            nonce: BigInt(nonce),
          }
        })
      })

      return NextResponse.json({
        action: 'start',
        roundId: round.id,
        currentCard: game.currentCard,
        currentMultiplier: 1.0,
        status: 'active',
      })
    }

    // Guess or Cashout actions
    const activeRound = await prisma.hiLoRound.findFirst({
      where: { userId, status: 'active' }
    })
    if (!activeRound) {
      return NextResponse.json({ error: 'No active HiLo game found.' }, { status: 400 })
    }

    const deck: number[] = JSON.parse(activeRound.deck)
    const currentIndex = activeRound.currentIndex
    const currentCard = cardFromIndex(deck[currentIndex])
    const currentCardValue = currentCard.value
    const remaining = deck.slice(currentIndex + 1)

    if (body.action === 'guess') {
      if (!body.prediction) {
        return NextResponse.json({ error: 'prediction is required to guess' }, { status: 400 })
      }

      const { odds, winCount } = getHiLoOdds(currentCardValue, remaining, body.prediction)
      if (winCount === 0) {
        // Instant loss (no winning cards remaining in that direction)
        const updated = await prisma.$transaction(async (tx) => {
          return tx.hiLoRound.update({
            where: { id: activeRound.id },
            data: { status: 'busted', currentMultiplier: 0 }
          })
        })
        return NextResponse.json({ action: 'guess', status: 'busted', payout: 0, currentMultiplier: 0 })
      }

      const nextCardIndex = remaining[0]
      const nextCard = cardFromIndex(nextCardIndex)
      const nextCardValue = nextCard.value

      let won = false
      if (body.prediction === 'higher') won = nextCardValue > currentCardValue
      else if (body.prediction === 'lower') won = nextCardValue < currentCardValue
      else won = nextCardValue === currentCardValue

      if (won) {
        const nextMultiplier = parseFloat((activeRound.currentMultiplier * odds).toFixed(4))
        const nextIndex = currentIndex + 1
        const isFinished = nextIndex >= deck.length - 1

        const updated = await prisma.$transaction(async (tx) => {
          if (isFinished) {
            const payout = parseFloat((Number(activeRound.betAmount) * nextMultiplier).toFixed(2))
            await creditPayout({ userId, gameId: 'hilo', roundId: activeRound.id, payout }, tx)
            return tx.hiLoRound.update({
              where: { id: activeRound.id },
              data: { currentIndex: nextIndex, currentMultiplier: nextMultiplier, status: 'cashed_out' }
            })
          } else {
            return tx.hiLoRound.update({
              where: { id: activeRound.id },
              data: { currentIndex: nextIndex, currentMultiplier: nextMultiplier }
            })
          }
        })

        return NextResponse.json({
          action: 'guess',
          status: updated.status,
          currentCard: nextCard,
          currentMultiplier: nextMultiplier,
          payout: updated.status === 'cashed_out' ? parseFloat((Number(activeRound.betAmount) * nextMultiplier).toFixed(2)) : 0,
        })
      } else {
        // Lost
        const updated = await prisma.$transaction(async (tx) => {
          return tx.hiLoRound.update({
            where: { id: activeRound.id },
            data: { status: 'busted', currentMultiplier: 0 }
          })
        })
        return NextResponse.json({
          action: 'guess',
          status: 'busted',
          currentCard: nextCard,
          currentMultiplier: 0,
          payout: 0,
        })
      }
    }

    if (body.action === 'cashout') {
      const payout = parseFloat((Number(activeRound.betAmount) * activeRound.currentMultiplier).toFixed(2))
      const updated = await prisma.$transaction(async (tx) => {
        if (payout > 0) {
          await creditPayout({ userId, gameId: 'hilo', roundId: activeRound.id, payout }, tx)
        }
        return tx.hiLoRound.update({
          where: { id: activeRound.id },
          data: { status: 'cashed_out' }
        })
      })

      return NextResponse.json({
        action: 'cashout',
        status: 'cashed_out',
        payout,
        currentMultiplier: activeRound.currentMultiplier,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
