import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ balance: 0, user: null }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    
    return NextResponse.json({ balance: user.balance, user })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get balance' }, { status: 500 })
  }
}
