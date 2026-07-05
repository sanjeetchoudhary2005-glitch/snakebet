import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { generateDragonPositions, getDragonTowerMultiplier, DRAGON_TOWER_CONFIG } from '@/lib/games/dragontower'
import { generateServerSeed, hashServerSeed } from '@/lib/games/rng'
import { placeBet, creditPayout } from '@/lib/wallet'
import { validateBet } from '@/lib/games/validator'
import { enforceBetRateLimit } from '@/lib/rateLimit'

const schema = z.object({
  action: z.enum(['start', 'reveal', 'cashout']),
  betAmount: z.number().positive().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']).optional(),
  clientSeed: z.string().min(1).max(64).optional(),
  tileIndex: z.number().int().min(0).max(3).optional(),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id
    const limited = await enforceBetRateLimit(userId, 'dragontower:play')
    if (limited) return limited

    const body = schema.parse(await req.json())

    if (body.action === 'start') {
      if (!body.betAmount || !body.difficulty || !body.clientSeed) {
        return NextResponse.json({ error: 'betAmount, difficulty, and clientSeed are required to start' }, { status: 400 })
      }
      await validateBet(userId, body.betAmount)

      const existing = await prisma.dragonTowerRound.findFirst({
        where: { userId, status: 'active' }
      })
      if (existing) {
        return NextResponse.json({ error: 'An active Dragon Tower game already exists.' }, { status: 400 })
      }

      const serverSeed = generateServerSeed()
      const serverSeedHash = hashServerSeed(serverSeed)
      const nonce = Date.now()
      const layout = generateDragonPositions(serverSeed, body.clientSeed, nonce, 9, body.difficulty)
      const roundId = `dragontower-${nonce}`

      const round = await prisma.$transaction(async (tx) => {
        await placeBet({ userId, gameId: 'dragontower', amount: body.betAmount!, roundId }, tx)
        return tx.dragonTowerRound.create({
          data: {
            userId,
            betAmount: body.betAmount!,
            difficulty: body.difficulty!,
            levelLayout: JSON.stringify(layout),
            currentLevel: 0,
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
        difficulty: body.difficulty,
        status: 'active',
        currentMultiplier: 1.0,
        currentLevel: 0,
      })
    }

    const activeRound = await prisma.dragonTowerRound.findFirst({
      where: { userId, status: 'active' }
    })
    if (!activeRound) {
      return NextResponse.json({ error: 'No active Dragon Tower game found.' }, { status: 400 })
    }

    const layout: number[][] = JSON.parse(activeRound.levelLayout)
    const currentLevel = activeRound.currentLevel

    if (body.action === 'reveal') {
      if (body.tileIndex === undefined) {
        return NextResponse.json({ error: 'tileIndex is required to reveal' }, { status: 400 })
      }

      const rowTraps = layout[currentLevel]
      const hitTrap = rowTraps.includes(body.tileIndex)

      if (hitTrap) {
        // Busted
        const updated = await prisma.$transaction(async (tx) => {
          return tx.dragonTowerRound.update({
            where: { id: activeRound.id },
            data: { status: 'busted', currentMultiplier: 0 }
          })
        })
        return NextResponse.json({
          action: 'reveal',
          status: 'busted',
          hitTrap: true,
          layout,
          currentMultiplier: 0,
          payout: 0,
        })
      } else {
        const nextLevel = currentLevel + 1
        const multiplier = getDragonTowerMultiplier(nextLevel, activeRound.difficulty as keyof typeof DRAGON_TOWER_CONFIG)
        const wonAll = nextLevel === 9

        const updated = await prisma.$transaction(async (tx) => {
          if (wonAll) {
            const payout = parseFloat((Number(activeRound.betAmount) * multiplier).toFixed(2))
            await creditPayout({ userId, gameId: 'dragontower', roundId: activeRound.id, payout }, tx)
            return tx.dragonTowerRound.update({
              where: { id: activeRound.id },
              data: {
                status: 'cashed_out',
                currentLevel: nextLevel,
                currentMultiplier: multiplier
              }
            })
          } else {
            return tx.dragonTowerRound.update({
              where: { id: activeRound.id },
              data: {
                currentLevel: nextLevel,
                currentMultiplier: multiplier
              }
            })
          }
        })

        return NextResponse.json({
          action: 'reveal',
          status: updated.status,
          hitTrap: false,
          currentLevel: nextLevel,
          currentMultiplier: multiplier,
          payout: updated.status === 'cashed_out' ? parseFloat((Number(activeRound.betAmount) * multiplier).toFixed(2)) : 0,
          layout: updated.status === 'cashed_out' ? layout : undefined,
        })
      }
    }

    if (body.action === 'cashout') {
      if (currentLevel === 0) {
        return NextResponse.json({ error: 'Cannot cashout at level 0' }, { status: 400 })
      }
      const multiplier = getDragonTowerMultiplier(currentLevel, activeRound.difficulty as keyof typeof DRAGON_TOWER_CONFIG)
      const payout = parseFloat((Number(activeRound.betAmount) * multiplier).toFixed(2))

      const updated = await prisma.$transaction(async (tx) => {
        if (payout > 0) {
          await creditPayout({ userId, gameId: 'dragontower', roundId: activeRound.id, payout }, tx)
        }
        return tx.dragonTowerRound.update({
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
        layout,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
