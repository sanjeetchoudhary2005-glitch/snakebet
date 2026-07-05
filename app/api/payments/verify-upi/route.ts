import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { isNextResponse, parseJson } from '@/lib/api'

const verifySchema = z.object({
  txnId: z.string().min(1),
  reference: z.string().trim().min(1).max(120).optional(),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const parsed = await parseJson(req, verifySchema)
    if (isNextResponse(parsed)) return parsed
    const { txnId, reference } = parsed
    
    await prisma.$transaction(async (tx) => {
      // Get transaction
      const txn = await tx.transaction.findUnique({
        where: { id: txnId }
      })
      
      if (!txn) {
        throw new Error('Transaction not found')
      }
      if (txn.userId !== userId) {
        throw new Error('Transaction not found')
      }
      if (txn.status === 'COMPLETED') {
        throw new Error('Transaction already completed')
      }
      
      const user = await tx.user.findUnique({
        where: { id: txn.userId }
      })
      
      if (!user) {
        throw new Error('User not found')
      }
      
      const balanceBefore = user.balance
      const balanceAfter = balanceBefore.toNumber() + txn.amount.toNumber()

      // Update transaction and user balance in a transaction
      await tx.transaction.update({
        where: { id: txnId },
        data: { 
          status: 'COMPLETED',
          reference: reference || txn.reference,
          balanceBefore,
          balanceAfter,
        }
      })
      
      await tx.user.update({
        where: { id: txn.userId },
        data: { 
          balance: { increment: txn.amount },
          totalDeposited: { increment: txn.amount },
        }
      })
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 })
  }
}
