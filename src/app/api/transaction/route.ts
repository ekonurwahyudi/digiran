import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const year = parseInt(req.nextUrl.searchParams.get('year') || new Date().getFullYear().toString())
  const glAccountId = req.nextUrl.searchParams.get('glAccountId')
  const quarter = req.nextUrl.searchParams.get('quarter')
  const regionalCode = req.nextUrl.searchParams.get('regionalCode')

  const where: Record<string, unknown> = { year }
  if (glAccountId) where.glAccountId = glAccountId
  if (quarter) where.quarter = parseInt(quarter)
  if (regionalCode) where.regionalCode = regionalCode

  const transactions = await prisma.transaction.findMany({
    where,
    include: { glAccount: true, vendor: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(transactions)
}

export async function POST(req: NextRequest) {
  const data = await req.json()

  // Calculate PPN values
  const nilaiKwitansi = data.nilaiKwitansi || 0
  let nilaiTanpaPPN = nilaiKwitansi
  let nilaiPPN = 0

  if (data.jenisPajak === 'PPN11') {
    nilaiTanpaPPN = nilaiKwitansi / 1.11
    nilaiPPN = nilaiKwitansi - nilaiTanpaPPN
  } else if (data.jenisPajak === 'PPNJasa2') {
    nilaiPPN = nilaiKwitansi * 0.02
    nilaiTanpaPPN = nilaiKwitansi - nilaiPPN
  } else if (data.jenisPajak === 'PPNInklaring1.1') {
    nilaiPPN = nilaiKwitansi * 0.011
    nilaiTanpaPPN = nilaiKwitansi - nilaiPPN
  }

  // Determine status
  let status = 'Open'
  if (data.tglTransferVendor) {
    status = 'Close'
  } else if (data.noTiketMydx || data.tglSerahFinance) {
    status = 'Proses'
  }

  const transaction = await prisma.transaction.create({
    data: {
      glAccountId: data.glAccountId,
      quarter: data.quarter,
      regionalCode: data.regionalCode,
      kegiatan: data.kegiatan,
      regionalPengguna: data.regionalPengguna,
      year: data.year || new Date().getFullYear(),
      tanggalKwitansi: data.tanggalKwitansi ? new Date(data.tanggalKwitansi) : null,
      nilaiKwitansi,
      jenisPajak: data.jenisPajak,
      nilaiTanpaPPN,
      nilaiPPN,
      keterangan: data.keterangan,
      jenisPengadaan: data.jenisPengadaan,
      vendorId: data.vendorId || null,
      noTiketMydx: data.noTiketMydx,
      tglSerahFinance: data.tglSerahFinance ? new Date(data.tglSerahFinance) : null,
      picFinance: data.picFinance,
      noHpFinance: data.noHpFinance,
      tglTransferVendor: data.tglTransferVendor ? new Date(data.tglTransferVendor) : null,
      nilaiTransfer: data.nilaiTransfer,
      taskPengajuan: true,
      taskTransferVendor: data.taskTransferVendor || false,
      taskTerimaBerkas: data.taskTerimaBerkas || false,
      taskUploadMydx: !!data.noTiketMydx,
      taskSerahFinance: !!data.tglSerahFinance,
      taskVendorDibayar: !!data.tglTransferVendor,
      status,
    },
  })

  return NextResponse.json(transaction)
}
