import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Fetch all imprest funds
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    const where = status ? { status } : {}
    
    const imprestFunds = await (prisma as any).imprestFund.findMany({
      where,
      select: {
        id: true,
        kelompokKegiatan: true,
        regionalCode: true,
        status: true,
        totalAmount: true,
        debit: true,
        keterangan: true,
        noTiketMydx: true,
        tglSerahFinance: true,
        picFinance: true,
        noHpFinance: true,
        tglTransferVendor: true,
        nilaiTransfer: true,
        taskPengajuan: true,
        taskTransferVendor: true,
        taskTerimaBerkas: true,
        taskUploadMydx: true,
        taskSerahFinance: true,
        taskVendorDibayar: true,
        createdAt: true,
        updatedAt: true,
        imprestFundCard: {
          select: {
            id: true,
            user: true,
            nomorKartu: true
          }
        },
        items: {
          select: {
            id: true,
            tanggal: true,
            uraian: true,
            jumlah: true,
            glAccountId: true,
            areaPengguna: true,
            glAccount: {
              select: {
                id: true,
                code: true,
                description: true
              }
            }
          }
        },
        transactions: {
          select: {
            id: true,
            kegiatan: true,
            status: true,
            nilaiKwitansi: true,
            noTiketMydx: true,
            tglSerahFinance: true,
            picFinance: true,
            noHpFinance: true,
            tglTransferVendor: true,
            nilaiTransfer: true,
            glAccount: {
              select: {
                id: true,
                code: true,
                description: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(imprestFunds, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  } catch (error) {
    console.error('Error fetching imprest funds:', error)
    return NextResponse.json({ error: 'Failed to fetch imprest funds' }, { status: 500 })
  }
}

// POST - Create new imprest fund
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { kelompokKegiatan, regionalCode, imprestFundCardId, items, status = 'draft' } = body

    if (!kelompokKegiatan || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Kelompok kegiatan and items are required' }, { status: 400 })
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.jumlah || 0), 0)

    // Create imprest fund with items first
    const imprestFund = await (prisma as any).imprestFund.create({
      data: {
        kelompokKegiatan,
        ...(regionalCode && { regionalCode }),
        ...(imprestFundCardId && { imprestFundCardId }),
        status,
        totalAmount,
        items: {
          create: items.map((item: any) => ({
            tanggal: new Date(item.tanggal),
            uraian: item.uraian,
            glAccountId: item.glAccountId,
            areaPengguna: item.areaPengguna || null,
            jumlah: item.jumlah
          }))
        }
      },
      include: {
        items: {
          include: {
            glAccount: true
          }
        },
        imprestFundCard: true
      }
    })

    // If status is 'open', create transactions for each item
    if (status === 'open') {
      const currentYear = new Date().getFullYear()
      const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3)

      for (const item of items) {
        await (prisma as any).transaction.create({
          data: {
            glAccountId: item.glAccountId,
            quarter: currentQuarter,
            regionalCode: regionalCode || 'HO', // Alokasi Anggaran Regional - untuk potong budget
            kegiatan: item.uraian,
            regionalPengguna: item.areaPengguna || 'Head Office', // Area Pengguna dari item - hanya informasi
            year: currentYear,
            tanggalKwitansi: new Date(item.tanggal),
            nilaiKwitansi: item.jumlah,
            nilaiTanpaPPN: item.jumlah,
            status: 'Open',
            imprestFundId: imprestFund.id,
            jenisPengadaan: 'InpresFund'
          }
        })
      }

      // Reduce card saldo if imprestFundCardId is provided
      if (imprestFundCardId) {
        const card = await (prisma as any).imprestFundCard.findUnique({
          where: { id: imprestFundCardId }
        })

        if (card) {
          await (prisma as any).imprestFundCard.update({
            where: { id: imprestFundCardId },
            data: {
              saldo: card.saldo - totalAmount
            }
          })
        }
      }
    }

    return NextResponse.json(imprestFund)
  } catch (error) {
    console.error('Error creating imprest fund:', error)
    return NextResponse.json({ error: 'Failed to create imprest fund', details: String(error) }, { status: 500 })
  }
}