import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const data = await req.json()

  const regional = await prisma.regional.update({
    where: { id: params.id },
    data: {
      code: data.code,
      name: data.name,
      isActive: data.isActive,
    },
  })

  return NextResponse.json(regional)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.regional.update({
    where: { id: params.id },
    data: { isActive: false },
  })

  return NextResponse.json({ success: true })
}
