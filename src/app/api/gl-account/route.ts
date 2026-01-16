import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const includeInactive = req.nextUrl.searchParams.get('includeInactive') === 'true'
  
  const glAccounts = await prisma.glAccount.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { code: 'asc' },
  })
  return NextResponse.json(glAccounts)
}

export async function POST(req: NextRequest) {
  const data = await req.json()

  const glAccount = await prisma.glAccount.create({
    data: {
      code: data.code,
      description: data.description,
      keterangan: data.keterangan,
    },
  })

  return NextResponse.json(glAccount)
}
