import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const data = await req.json()

  // New flow: nilaiKwitansi from frontend is "Nilai Sebelum PPN"
  // We calculate nilaiPertanggungan (stored as nilaiKwitansi) and nilaiPPN
  const nilaiSebelumPPN = data.nilaiKwitansi || 0
  let nilaiPertanggungan = nilaiSebelumPPN
  let nilaiPPN = 0

  if (data.jenisPajak === 'PPN11') {
    nilaiPPN = nilaiSebelumPPN * 0.11
    nilaiPertanggungan = nilaiSebelumPPN + nilaiPPN
  } else if (data.jenisPajak === 'PPNJasa2') {
    nilaiPPN = nilaiSebelumPPN * 0.02
    nilaiPertanggungan = nilaiSebelumPPN + nilaiPPN
  } else if (data.jenisPajak === 'PPNInklaring1.1') {
    nilaiPPN = nilaiSebelumPPN * 0.011
    nilaiPertanggungan = nilaiSebelumPPN + nilaiPPN
  }

  // Task values
  const taskTransferVendor = data.taskTransferVendor || false
  const taskTerimaBerkas = data.taskTerimaBerkas || false
  const taskUploadMydx = !!data.noTiketMydx
  const taskSerahFinance = !!data.tglSerahFinance
  const taskVendorDibayar = !!data.tglTransferVendor

  // Determine status automatically based on fields and tasks
  // Close: semua field dan task terisi (kecuali keterangan)
  // Proses: ada perubahan/update dari Open
  // Open: baru dibuat
  
  let status = 'Proses' // Default saat edit adalah Proses
  
  // Check if all required fields are filled for Close status
  const allFieldsFilled = 
    data.glAccountId &&
    data.quarter &&
    data.regionalCode &&
    data.kegiatan &&
    data.regionalPengguna &&
    data.tanggalKwitansi &&
    nilaiSebelumPPN > 0 &&
    data.jenisPajak &&
    data.jenisPengadaan &&
    data.vendorId &&
    data.noTiketMydx &&
    data.tglSerahFinance &&
    data.picFinance &&
    data.noHpFinance &&
    data.tglTransferVendor &&
    data.nilaiTransfer

  // Check if all tasks are completed
  const allTasksCompleted = 
    taskTransferVendor &&
    taskTerimaBerkas &&
    taskUploadMydx &&
    taskSerahFinance &&
    taskVendorDibayar

  if (allFieldsFilled && allTasksCompleted) {
    status = 'Close'
  }

  const transaction = await prisma.transaction.update({
    where: { id: params.id },
    data: {
      glAccountId: data.glAccountId,
      quarter: data.quarter,
      regionalCode: data.regionalCode,
      kegiatan: data.kegiatan,
      regionalPengguna: data.regionalPengguna,
      tanggalKwitansi: data.tanggalKwitansi ? new Date(data.tanggalKwitansi) : null,
      nilaiKwitansi: nilaiPertanggungan, // Nilai Pertanggungan
      jenisPajak: data.jenisPajak,
      nilaiTanpaPPN: nilaiSebelumPPN, // Nilai Sebelum PPN
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
      taskTransferVendor,
      taskTerimaBerkas,
      taskUploadMydx,
      taskSerahFinance,
      taskVendorDibayar,
      status,
    },
  })

  // Sync Finance Information back to Imprest Fund if this transaction is linked
  if (transaction.imprestFundId) {
    // Determine imprest fund status based on transaction status
    let imprestStatus = 'open'
    if (status === 'Close') {
      imprestStatus = 'close'
    } else if (status === 'Proses') {
      imprestStatus = 'proses'
    }

    await prisma.imprestFund.update({
      where: { id: transaction.imprestFundId },
      data: {
        noTiketMydx: data.noTiketMydx || null,
        tglSerahFinance: data.tglSerahFinance ? new Date(data.tglSerahFinance) : null,
        picFinance: data.picFinance || null,
        noHpFinance: data.noHpFinance || null,
        tglTransferVendor: data.tglTransferVendor ? new Date(data.tglTransferVendor) : null,
        nilaiTransfer: data.nilaiTransfer || null,
        taskTransferVendor,
        taskTerimaBerkas,
        taskUploadMydx,
        taskSerahFinance,
        taskVendorDibayar,
        status: imprestStatus,
      },
    })
  }

  return NextResponse.json(transaction)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.transaction.delete({
    where: { id: params.id },
  })

  return NextResponse.json({ success: true })
}
