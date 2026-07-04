import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { shuffleDeck } from '@/lib/games/rng'
import { handValue, isBlackjack, playDealerHand, determineBlackjackResult } from '@/lib/games/blackjack'
import { generateServerSeed, hashServerSeed } from '@/lib/games/rng'
import { placeBet, creditPayout } from '@/lib/wallet'
import { validateBet } from '@/lib/games/validator'
import { enforceBetRateLimit } from '@/lib/rateLimit'

const schema = z.object({
  action: z.enum(['start', 'hit', 'stand']),
  betAmount: z.number().positive().optional(),
  clientSeed: z.string().min(1).max(64).optional(),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id
    const limited = await enforceBetRateLimit(userId, 'blackjack:play')
    if (limited) return limited

    const body = schema.parse(await req.json())

    if (body.action === 'start') {
      if (!body.betAmount || !body.clientSeed) {
        return NextResponse.json({ error: 'betAmount and clientSeed are required to start' }, { status: 400 })
      }
      await validateBet(userId, body.betAmount)

      const existing = await prisma.blackjackRound.findFirst({
        where: { userId, status: { in: ['waiting', 'player_turn', 'dealer_turn'] } }
      })
      if (existing) {
        return NextResponse.json({ error: 'An active Blackjack game already exists.' }, { status: 400 })
      }

      const serverSeed = generateServerSeed()
      const serverSeedHash = hashServerSeed(serverSeed)
      const nonce = Date.now()
      const deck = shuffleDeck(serverSeed, body.clientSeed, nonce)

      let pos = 0
      const playerHand = [deck[pos++], deck[pos++]]
      const dealerHand = [deck[pos++], deck[pos++]]

      const playerHasBJ = isBlackjack(playerHand)
      const dealerHasBJ = isBlackjack(dealerHand)

      let status = 'player_turn'
      let payout = 0
      let settled = false

      if (playerHasBJ || dealerHasBJ) {
        // Natural blackjack check immediately terminates game
        status = 'settled'
        settled = true
        const { multiplier } = determineBlackjackResult(playerHand, dealerHand)
        payout = parseFloat((body.betAmount * multiplier).toFixed(2))
      }

      const roundId = `blackjack-${nonce}`

      const round = await prisma.$transaction(async (tx) => {
        await placeBet({ userId, gameId: 'blackjack', amount: body.betAmount!, roundId }, tx)
        if (settled && payout > 0) {
          await creditPayout({ userId, gameId: 'blackjack', roundId, payout }, tx)
        }

        return tx.blackjackRound.create({
          data: {
            userId,
            betAmount: body.betAmount!,
            deck: JSON.stringify(deck),
            playerHand: JSON.stringify(playerHand),
            dealerHand: JSON.stringify(dealerHand),
            currentIndex: pos,
            status,
            payout,
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
        playerHand,
        dealerHand: settled ? dealerHand : [dealerHand[0]], // Hide dealer's hole card unless settled
        playerScore: handValue(playerHand).value,
        dealerScore: settled ? handValue(dealerHand).value : undefined,
        status,
        payout,
        won: payout > 0,
      })
    }

    const activeRound = await prisma.blackjackRound.findFirst({
      where: { userId, status: 'player_turn' }
    })
    if (!activeRound) {
      return NextResponse.json({ error: 'No active Blackjack game in player turn found.' }, { status: 400 })
    }

    const deck: number[] = JSON.parse(activeRound.deck)
    const playerHand: number[] = JSON.parse(activeRound.playerHand)
    const dealerHand: number[] = JSON.parse(activeRound.dealerHand)
    let currentIndex = activeRound.currentIndex

    if (body.action === 'hit') {
      const nextCard = deck[currentIndex++]
      playerHand.push(nextCard)
      const pScore = handValue(playerHand).value

      let status = 'player_turn'
      let payout = 0

      if (pScore > 21) {
        // Player busted, immediate loss
        status = 'settled'
        const updated = await prisma.$transaction(async (tx) => {
          return tx.blackjackRound.update({
            where: { id: activeRound.id },
            data: {
              playerHand: JSON.stringify(playerHand),
              currentIndex,
              status,
              payout: 0,
            }
          })
        })
        return NextResponse.json({
          action: 'hit',
          roundId: activeRound.id,
          playerHand,
          dealerHand,
          playerScore: pScore,
          dealerScore: handValue(dealerHand).value,
          status,
          payout: 0,
          won: false,
        })
      } else {
        const updated = await prisma.$transaction(async (tx) => {
          return tx.blackjackRound.update({
            where: { id: activeRound.id },
            data: {
              playerHand: JSON.stringify(playerHand),
              currentIndex,
            }
          })
        })
        return NextResponse.json({
          action: 'hit',
          roundId: activeRound.id,
          playerHand,
          dealerHand: [dealerHand[0]],
          playerScore: pScore,
          status,
          payout: 0,
          won: false,
        })
      }
    }

    if (body.action === 'stand') {
      const dealerResult = playDealerHand(deck, dealerHand, currentIndex)
      const finalDealerHand = dealerResult.finalHand
      const finalIndex = dealerResult.finalDeckPosition

      const { multiplier } = determineBlackjackResult(playerHand, finalDealerHand)
      const payout = parseFloat((Number(activeRound.betAmount) * multiplier).toFixed(2))

      const round = await prisma.$transaction(async (tx) => {
        if (payout > 0) {
          await creditPayout({ userId, gameId: 'blackjack', roundId: activeRound.id, payout }, tx)
        }
        return tx.blackjackRound.update({
          where: { id: activeRound.id },
          data: {
            dealerHand: JSON.stringify(finalDealerHand),
            currentIndex: finalIndex,
            status: 'settled',
            payout,
          }
        })
      })

      return NextResponse.json({
        action: 'stand',
        roundId: activeRound.id,
        playerHand,
        dealerHand: finalDealerHand,
        playerScore: handValue(playerHand).value,
        dealerScore: handValue(finalDealerHand).value,
        status: 'settled',
        payout,
        won: payout > 0,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
