import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin'
import { isNextResponse, parseJson } from '@/lib/api'

const approvalSchema = z.object({
  requestId: z.string().min(1),
  adminNotes: z.string().max(500).optional().nullable(),
  approve: z.boolean(),
})

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin()
    if (!admin.ok) return admin.response

    const parsed = await parseJson(req, approvalSchema)
    if (isNextResponse(parsed)) return parsed
    const { requestId, adminNotes, approve } = parsed

    const updatedRequest = await prisma.$transaction(async (tx) => {
      const request = await tx.withdrawRequest.findUnique({
        where: { id: requestId },
        include: { user: { select: { balance: true } } },
      })

      if (!request) {
        throw new Error('Request not found')
      }

      if (request.status !== 'PENDING') {
        throw new Error('Request already processed')
      }

      const nextRequest = await tx.withdrawRequest.update({
        where: { id: requestId },
        data: {
          status: approve ? 'COMPLETED' : 'REJECTED',
          adminNotes,
          processedAt: new Date()
        }
      })

      if (!approve) {
        const amount = new Prisma.Decimal(request.amount)
        const updatedUser = await tx.user.update({
          where: { id: request.userId },
          data: { balance: { increment: amount } },
          select: { balance: true },
        })
        await tx.transaction.create({
          data: {
            userId: request.userId,
            type: 'WITHDRAWAL_REVERSAL',
            amount,
            balanceBefore: request.user.balance,
            balanceAfter: updatedUser.balance,
            method: 'ADMIN',
            reference: request.id,
            reason: `Withdrawal rejected: ${adminNotes || 'No notes'}`,
            adminUserId: admin.userId,
          },
        })
      }

      await tx.adminLog.create({
        data: {
          adminId: admin.userId,
          action: approve ? 'WITHDRAWAL_APPROVED' : 'WITHDRAWAL_REJECTED',
          targetId: requestId,
          details: JSON.stringify({ userId: request.userId, amount: request.amount, adminNotes }),
        },
      })

      return nextRequest
    })

    return NextResponse.json(updatedRequest)
  } catch (error: any) {
    const message = error.message || 'Failed to process withdrawal'
    const status = message.includes('not found') ? 404 : message.includes('already') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
