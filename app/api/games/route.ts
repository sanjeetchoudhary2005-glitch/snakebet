import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { generateReferralCode } from '@/lib/otp'
import { z } from 'zod'
import { auth } from '@/auth'
import { isNextResponse, parseJson } from '@/lib/api'

const gameRecordSchema = z.object({
  type: z.string().trim().min(1).max(40),
  betAmount: z.number().min(0).max(100000),
  multiplier: z.number().min(0).max(100000),
  result: z.enum(['WIN', 'LOSS', 'CASHOUT']),
  details: z.unknown().optional(),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = await parseJson(req, gameRecordSchema)
    if (isNextResponse(parsed)) return parsed
    const { type, betAmount, multiplier, result, details } = parsed
    const userId = session.user.id

    // Record-only: no wallet mutations. Wallet operations (placeBet/creditPayout)
    // must go through dedicated game-specific APIs.
    const game = await prisma.game.create({
      data: {
        userId,
        type,
        betAmount,
        multiplier,
        result,
        winAmount: 0,
        details: JSON.stringify(details)
      }
    });

    return NextResponse.json(game);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to record game' }, { status: 500 });
  }
}

export async function GET() {
  try {
    let user = await prisma.user.findFirst({
      where: { username: 'demo' }
    })
    
    if (!user) {
      const referralCode = generateReferralCode('demo');
      user = await prisma.user.create({
        data: {
          username: 'demo',
          email: 'demo@Snakebet.com',
          balance: 10000,
          referralCode,
        }
      })
    }

    const games = await prisma.game.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(games.map(g => ({
      ...g,
      details: g.details ? JSON.parse(g.details) : null
    })))
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
  }
}
