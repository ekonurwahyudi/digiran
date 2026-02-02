import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const data = await req.json()

  const budget = await prisma.budget.update({
    where: { id: params.id },
    data: {
      rkap: data.rkap,
      releasePercent: data.releasePercent,
      totalAmount: data.totalAmount,
      q1Amount: data.q1Amount,
      q2Amount: data.q2Amount,
      q3Amount: data.q3Amount,
      q4Amount: data.q4Amount,
      janAmount: data.janAmount ?? undefined,
      febAmount: data.febAmount ?? undefined,
      marAmount: data.marAmount ?? undefined,
      aprAmount: data.aprAmount ?? undefined,
      mayAmount: data.mayAmount ?? undefined,
      junAmount: data.junAmount ?? undefined,
      julAmount: data.julAmount ?? undefined,
      augAmount: data.augAmount ?? undefined,
      sepAmount: data.sepAmount ?? undefined,
      octAmount: data.octAmount ?? undefined,
      novAmount: data.novAmount ?? undefined,
      decAmount: data.decAmount ?? undefined,
    },
  })

  return NextResponse.json(budget)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  // Delete allocations first
  await prisma.regionalAllocation.deleteMany({
    where: { budgetId: params.id },
  })
  
  await prisma.budget.delete({
    where: { id: params.id },
  })

  return NextResponse.json({ success: true })
}
