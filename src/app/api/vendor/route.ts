import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const includeInactive = req.nextUrl.searchParams.get('includeInactive') === 'true'
  
  const vendors = await prisma.vendor.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(vendors)
}

export async function POST(req: NextRequest) {
  const data = await req.json()

  const vendor = await prisma.vendor.create({
    data: {
      name: data.name,
      alamat: data.alamat,
      pic: data.pic,
      phone: data.phone,
      email: data.email,
    },
  })

  return NextResponse.json(vendor)
}
