import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Fetch all cash records
export async function GET() {
  try {
    const cashRecords = await (prisma as any).cash.findMany({
      include: {
        karyawan: {
          select: {
            id: true,
            nama: true,
            nik: true,
            jabatan: true
          }
        }
      },
      orderBy: {
        tanggal: 'desc'
      }
    })

    return NextResponse.json(cashRecords)
  } catch (error) {
    console.error('Error fetching cash records:', error)
    return NextResponse.json({ error: 'Failed to fetch cash records' }, { status: 500 })
  }
}

// POST - Create new cash record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { karyawanId, tanggal, tipe, jumlah, keterangan } = body

    if (!karyawanId || !tanggal || !tipe || !jumlah) {
      return NextResponse.json({ error: 'Karyawan, tanggal, tipe, dan jumlah harus diisi' }, { status: 400 })
    }

    if (!['masuk', 'keluar'].includes(tipe)) {
      return NextResponse.json({ error: 'Tipe harus masuk atau keluar' }, { status: 400 })
    }

    const cash = await (prisma as any).cash.create({
      data: {
        karyawanId,
        tanggal: new Date(tanggal),
        tipe,
        jumlah,
        keterangan: keterangan || null
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

    return NextResponse.json(cash, { status: 201 })
  } catch (error) {
    console.error('Error creating cash record:', error)
    return NextResponse.json({ error: 'Failed to create cash record' }, { status: 500 })
  }
}
