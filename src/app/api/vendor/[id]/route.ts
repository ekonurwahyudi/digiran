import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const data = await req.json()

  const vendor = await prisma.vendor.update({
    where: { id: params.id },
    data: {
      name: data.name,
      alamat: data.alamat,
      pic: data.pic,
      phone: data.phone,
      email: data.email,
      isActive: data.isActive,
    },
  })

  return NextResponse.json(vendor)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.vendor.update({
    where: { id: params.id },
    data: { isActive: false },
  })

  return NextResponse.json({ success: true })
}
