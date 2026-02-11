import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { nama, nik, jabatan, nomorHp, isActive } = body

    const karyawan = await (prisma as any).karyawan.update({
      where: { id },
      data: { nama, nik, jabatan, nomorHp, isActive }
    })

    return NextResponse.json(karyawan)
  } catch (error: any) {
    console.error('Error updating karyawan:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'NIK sudah terdaftar' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update karyawan' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await (prisma as any).karyawan.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting karyawan:', error)
    return NextResponse.json({ error: 'Failed to delete karyawan' }, { status: 500 })
  }
}
