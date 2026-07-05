import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { generateMinePositions, getMinesMultiplier } from '@/lib/games/mines'
import { generateServerSeed, hashServerSeed } from '@/lib/games/rng'
import { placeBet, creditPayout } from '@/lib/wallet'
import { validateBet } from '@/lib/games/validator'
import { enforceBetRateLimit } from '@/lib/rateLimit'

const schema = z.object({
  action: z.enum(['start', 'reveal', 'cashout']),
  betAmount: z.number().positive().optional(),
  mineCount: z.number().int().min(1).max(24).optional(),
  clientSeed: z.string().min(1).max(64).optional(),
  tileIndex: z.number().int().min(0).max(24).optional(),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id
    const limited = await enforceBetRateLimit(userId, 'mines:play')
    if (limited) return limited

    const body = schema.parse(await req.json())

    if (body.action === 'start') {
      if (!body.betAmount || !body.mineCount || !body.clientSeed) {
        return NextResponse.json({ error: 'betAmount, mineCount and clientSeed are required to start' }, { status: 400 })
      }
      await validateBet(userId, body.betAmount)

      const existing = await prisma.minesRound.findFirst({
        where: { userId, status: 'active' }
      })
      if (existing) {
        return NextResponse.json({ error: 'An active Mines game already exists.' }, { status: 400 })
      }

      const serverSeed = generateServerSeed()
      const serverSeedHash = hashServerSeed(serverSeed)
      const nonce = Date.now()
      const minePositions = generateMinePositions(serverSeed, body.clientSeed, nonce, body.mineCount)
      const roundId = `mines-${nonce}`

      const round = await prisma.$transaction(async (tx) => {
        await placeBet({ userId, gameId: 'mines', amount: body.betAmount!, roundId }, tx)
        return tx.minesRound.create({
          data: {
            userId,
            betAmount: body.betAmount!,
            mineCount: body.mineCount!,
            minePositions: JSON.stringify(minePositions),
            revealedTiles: '[]',
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
        mineCount: body.mineCount,
        serverSeedHash,
        status: 'active',
        currentMultiplier: 1.0,
      })
    }

    const activeRound = await prisma.minesRound.findFirst({
      where: { userId, status: 'active' }
    })
    if (!activeRound) {
      return NextResponse.json({ error: 'No active Mines game found.' }, { status: 400 })
    }

    const minePositions: number[] = JSON.parse(activeRound.minePositions)
    const revealedTiles: number[] = JSON.parse(activeRound.revealedTiles)

    if (body.action === 'reveal') {
      if (body.tileIndex === undefined) {
        return NextResponse.json({ error: 'tileIndex is required to reveal' }, { status: 400 })
      }
      if (revealedTiles.includes(body.tileIndex)) {
        return NextResponse.json({ error: 'Tile already revealed' }, { status: 400 })
      }

      const hitMine = minePositions.includes(body.tileIndex)
      if (hitMine) {
        // Busted
        const updated = await prisma.$transaction(async (tx) => {
          return tx.minesRound.update({
            where: { id: activeRound.id },
            data: {
              status: 'busted',
              revealedTiles: JSON.stringify([...revealedTiles, body.tileIndex!]),
              currentMultiplier: 0
            }
          })
        })
        return NextResponse.json({
          action: 'reveal',
          status: 'busted',
          hitMine: true,
          minePositions,
          currentMultiplier: 0,
          payout: 0,
        })
      } else {
        const nextRevealed = [...revealedTiles, body.tileIndex]
        const multiplier = getMinesMultiplier(nextRevealed.length, activeRound.mineCount)
        const wonAll = nextRevealed.length === 25 - activeRound.mineCount

        const updated = await prisma.$transaction(async (tx) => {
          if (wonAll) {
            const payout = parseFloat((Number(activeRound.betAmount) * multiplier).toFixed(2))
            await creditPayout({ userId, gameId: 'mines', roundId: activeRound.id, payout }, tx)
            return tx.minesRound.update({
              where: { id: activeRound.id },
              data: {
                status: 'cashed_out',
                revealedTiles: JSON.stringify(nextRevealed),
                currentMultiplier: multiplier
              }
            })
          } else {
            return tx.minesRound.update({
              where: { id: activeRound.id },
              data: {
                revealedTiles: JSON.stringify(nextRevealed),
                currentMultiplier: multiplier
              }
            })
          }
        })

        return NextResponse.json({
          action: 'reveal',
          status: updated.status,
          hitMine: false,
          currentMultiplier: multiplier,
          payout: updated.status === 'cashed_out' ? parseFloat((Number(activeRound.betAmount) * multiplier).toFixed(2)) : 0,
          minePositions: updated.status === 'cashed_out' ? minePositions : undefined,
        })
      }
    }

    if (body.action === 'cashout') {
      const multiplier = getMinesMultiplier(revealedTiles.length, activeRound.mineCount)
      const payout = parseFloat((Number(activeRound.betAmount) * multiplier).toFixed(2))

      const updated = await prisma.$transaction(async (tx) => {
        if (payout > 0) {
          await creditPayout({ userId, gameId: 'mines', roundId: activeRound.id, payout }, tx)
        }
        return tx.minesRound.update({
          where: { id: activeRound.id },
          data: {
            status: 'cashed_out',
            currentMultiplier: multiplier
          }
        })
      })

      return NextResponse.json({
        action: 'cashout',
        status: 'cashed_out',
        payout,
        currentMultiplier: multiplier,
        minePositions,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
