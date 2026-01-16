import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const glAccountId = req.nextUrl.searchParams.get('glAccountId')
    const quarter = parseInt(req.nextUrl.searchParams.get('quarter') || '1')
    const regionalCode = req.nextUrl.searchParams.get('regionalCode') || ''
    const year = parseInt(req.nextUrl.searchParams.get('year') || new Date().getFullYear().toString())

    if (!glAccountId || !regionalCode) {
      return NextResponse.json({ allocated: 0, used: 0, remaining: 0 })
    }

    // Get budget allocation for this regional and quarter
    const budget = await prisma.budget.findFirst({
      where: { glAccountId, year },
      include: { allocations: true },
    })

    if (!budget) {
      return NextResponse.json({ allocated: 0, used: 0, remaining: 0 })
    }

    const allocation = budget.allocations.find(
      (a) => a.regionalCode === regionalCode && a.quarter === quarter
    )

    const allocated = allocation?.amount || 0

    // Get total used for this regional and quarter
    const transactions = await prisma.transaction.aggregate({
      where: { glAccountId, quarter, regionalCode, year },
      _sum: { nilaiKwitansi: true },
    })

    const used = transactions._sum.nilaiKwitansi || 0
    const remaining = allocated - used

    return NextResponse.json({ allocated, used, remaining })
  } catch (error) {
    console.error('Error fetching remaining budget:', error)
    return NextResponse.json({ allocated: 0, used: 0, remaining: 0 })
  }
}
