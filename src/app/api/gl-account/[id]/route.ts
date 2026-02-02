import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const data = await req.json()

  const glAccount = await prisma.glAccount.update({
    where: { id: params.id },
    data: {
      code: data.code,
      description: data.description,
      keterangan: data.keterangan,
      isActive: data.isActive,
    },
  })

  return NextResponse.json(glAccount)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  // Soft delete - set isActive to false
  await prisma.glAccount.update({
    where: { id: params.id },
    data: { isActive: false },
  })

  return NextResponse.json({ success: true })
}
