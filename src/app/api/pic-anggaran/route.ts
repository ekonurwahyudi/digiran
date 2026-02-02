import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const year = req.nextUrl.searchParams.get('year')
  
  const where: Record<string, unknown> = {}
  if (year) where.year = parseInt(year)

  const picAnggaran = await prisma.picAnggaran.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(picAnggaran)
}

export async function POST(req: NextRequest) {
  const data = await req.json()

  const picAnggaran = await prisma.picAnggaran.create({
    data: {
      unit: data.unit,
      namaPemegangImprest: data.namaPemegangImprest,
      nikPemegangImprest: data.nikPemegangImprest,
      namaPenanggungJawab: data.namaPenanggungJawab,
      nikPenanggungJawab: data.nikPenanggungJawab,
      year: data.year,
    },
  })

  return NextResponse.json(picAnggaran)
}
