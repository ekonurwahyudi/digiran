import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Fetch single cash record
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cash = await (prisma as any).cash.findUnique({
      where: { id: params.id },
      include: {
        karyawan: {
          select: {
            id: true,
            nama: true,
            nik: true,
            jabatan: true
          }
        }
      }
    })

    if (!cash) {
      return NextResponse.json({ error: 'Cash record not found' }, { status: 404 })
    }

    return NextResponse.json(cash)
  } catch (error) {
    console.error('Error fetching cash record:', error)
    return NextResponse.json({ error: 'Failed to fetch cash record' }, { status: 500 })
  }
}

// PUT - Update cash record
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { karyawanId, tanggal, tipe, jumlah, keterangan } = body

    if (tipe && !['masuk', 'keluar'].includes(tipe)) {
      return NextResponse.json({ error: 'Tipe harus masuk atau keluar' }, { status: 400 })
    }

    const cash = await (prisma as any).cash.update({
      where: { id: params.id },
      data: {
        ...(karyawanId && { karyawanId }),
        ...(tanggal && { tanggal: new Date(tanggal) }),
        ...(tipe && { tipe }),
        ...(jumlah !== undefined && { jumlah }),
        ...(keterangan !== undefined && { keterangan })
      },
      include: {
        karyawan: {
          select: {
            id: true,
            nama: true,
            nik: true,
            jabatan: true
          }
        }
      }
    })

    return NextResponse.json(cash)
  } catch (error) {
    console.error('Error updating cash record:', error)
    return NextResponse.json({ error: 'Failed to update cash record' }, { status: 500 })
  }
}

// DELETE - Delete cash record
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await (prisma as any).cash.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Cash record deleted successfully' })
  } catch (error) {
    console.error('Error deleting cash record:', error)
    return NextResponse.json({ error: 'Failed to delete cash record' }, { status: 500 })
  }
}
