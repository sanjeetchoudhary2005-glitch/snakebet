import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type RouteParams = {
  params: Promise<{ roundId: string }>
}

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { roundId } = await params
    const round = await prisma.slotsRound.findUnique({
      where: { id: roundId }
    })

    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...round,
      nonce: Number(round.nonce),
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to verify' }, { status: 500 })
  }
}
