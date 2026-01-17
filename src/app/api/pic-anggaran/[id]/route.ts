import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const data = await req.json()

  const picAnggaran = await prisma.picAnggaran.update({
    where: { id: params.id },
    data: {
      unit: data.unit,
      namaPemegangImprest: data.namaPemegangImprest,
      nikPemegangImprest: data.nikPemegangImprest,
      namaPenanggungJawab: data.namaPenanggungJawab,
      nikPenanggungJawab: data.nikPenanggungJawab,
      year: data.year,
      isActive: data.isActive,
    },
  })

  return NextResponse.json(picAnggaran)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.picAnggaran.delete({
    where: { id: params.id },
  })

  return NextResponse.json({ success: true })
}
