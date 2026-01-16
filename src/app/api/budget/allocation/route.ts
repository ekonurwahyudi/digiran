import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const data = await req.json()
  
  // Upsert allocations for each regional
  const allocations = await Promise.all(
    data.allocations.map((alloc: { budgetId: string; regionalCode: string; quarter: number; amount: number; percentage: number }) =>
      prisma.regionalAllocation.upsert({
        where: {
          budgetId_regionalCode_quarter: {
            budgetId: alloc.budgetId,
            regionalCode: alloc.regionalCode,
            quarter: alloc.quarter,
          },
        },
        update: { amount: alloc.amount, percentage: alloc.percentage || 0 },
        create: {
          budgetId: alloc.budgetId,
          regionalCode: alloc.regionalCode,
          quarter: alloc.quarter,
          amount: alloc.amount,
          percentage: alloc.percentage || 0,
        },
      })
    )
  )

  return NextResponse.json(allocations)
}

export async function GET(req: NextRequest) {
  const budgetId = req.nextUrl.searchParams.get('budgetId')
  
  if (!budgetId) {
    return NextResponse.json({ error: 'budgetId required' }, { status: 400 })
  }

  const allocations = await prisma.regionalAllocation.findMany({
    where: { budgetId },
  })

  return NextResponse.json(allocations)
}
