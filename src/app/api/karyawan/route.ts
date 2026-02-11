import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const karyawan = await (prisma as any).karyawan.findMany({
      orderBy: { nama: 'asc' }
    })
    return NextResponse.json(karyawan)
  } catch (error) {
    console.error('Error fetching karyawan:', error)
    return NextResponse.json({ error: 'Failed to fetch karyawan' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nama, nik, jabatan, nomorHp } = body

    const karyawan = await (prisma as any).karyawan.create({
      data: { nama, nik, jabatan, nomorHp }
    })

    return NextResponse.json(karyawan)
  } catch (error: any) {
    console.error('Error creating karyawan:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'NIK sudah terdaftar' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create karyawan' }, { status: 500 })
  }
}
