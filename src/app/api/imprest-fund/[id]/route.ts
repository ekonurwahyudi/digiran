import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Fetch single imprest fund
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const imprestFund = await (prisma as any).imprestFund.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            glAccount: true
          }
        },
        imprestFundCard: true
      }
    })

    if (!imprestFund) {
      return NextResponse.json({ error: 'Imprest fund not found' }, { status: 404 })
    }

    return NextResponse.json(imprestFund)
  } catch (error) {
    console.error('Error fetching imprest fund:', error)
    return NextResponse.json({ error: 'Failed to fetch imprest fund' }, { status: 500 })
  }
}

// PUT - Update imprest fund
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { 
      kelompokKegiatan, 
      regionalCode,
      imprestFundCardId,
      items, 
      status,
      keterangan,
      debit,
      // Finance fields
      noTiketMydx,
      tglSerahFinance,
      picFinance,
      noHpFinance,
      tglTransferVendor,
      nilaiTransfer,
      // Task fields
      taskPengajuan,
      taskTransferVendor,
      taskTerimaBerkas,
      taskUploadMydx,
      taskSerahFinance,
      taskVendorDibayar
    } = body

    // Get current imprest fund to check status change
    const currentImprest: any = await (prisma as any).imprestFund.findUnique({
      where: { id: params.id },
      include: { items: true }
    })

    if (!currentImprest) {
      return NextResponse.json({ error: 'Imprest fund not found' }, { status: 404 })
    }

    // Calculate total amount if items are provided
    let totalAmount = currentImprest.totalAmount
    if (items && Array.isArray(items)) {
      totalAmount = items.reduce((sum: number, item: any) => sum + (item.jumlah || 0), 0)
    }

    // Auto-calculate task fields based on Finance Information
    const finalNoTiketMydx = noTiketMydx !== undefined ? noTiketMydx : currentImprest.noTiketMydx
    const finalTglSerahFinance = tglSerahFinance !== undefined ? (tglSerahFinance ? new Date(tglSerahFinance) : null) : currentImprest.tglSerahFinance
    const finalTglTransferVendor = tglTransferVendor !== undefined ? (tglTransferVendor ? new Date(tglTransferVendor) : null) : currentImprest.tglTransferVendor
    
    const autoTaskUploadMydx = !!finalNoTiketMydx
    const autoTaskSerahFinance = !!finalTglSerahFinance
    const autoTaskVendorDibayar = !!finalTglTransferVendor

    // Build update data object
    const updateData: any = {
      kelompokKegiatan: kelompokKegiatan || currentImprest.kelompokKegiatan,
      regionalCode: regionalCode !== undefined ? regionalCode : currentImprest.regionalCode,
      imprestFundCardId: imprestFundCardId !== undefined ? imprestFundCardId : currentImprest.imprestFundCardId,
      status: status || currentImprest.status,
      totalAmount,
      keterangan: keterangan !== undefined ? keterangan : currentImprest.keterangan,
      debit: debit !== undefined ? debit : currentImprest.debit,
      // Finance fields
      noTiketMydx: finalNoTiketMydx,
      tglSerahFinance: finalTglSerahFinance,
      picFinance: picFinance !== undefined ? picFinance : currentImprest.picFinance,
      noHpFinance: noHpFinance !== undefined ? noHpFinance : currentImprest.noHpFinance,
      tglTransferVendor: finalTglTransferVendor,
      nilaiTransfer: nilaiTransfer !== undefined ? nilaiTransfer : currentImprest.nilaiTransfer,
      // Task fields - auto-calculated based on Finance Information
      taskPengajuan: taskPengajuan !== undefined ? taskPengajuan : currentImprest.taskPengajuan,
      taskTransferVendor: taskTransferVendor !== undefined ? taskTransferVendor : currentImprest.taskTransferVendor,
      taskTerimaBerkas: taskTerimaBerkas !== undefined ? taskTerimaBerkas : currentImprest.taskTerimaBerkas,
      taskUploadMydx: autoTaskUploadMydx,
      taskSerahFinance: autoTaskSerahFinance,
      taskVendorDibayar: autoTaskVendorDibayar,
    }

    // If items are provided, update them
    if (items && Array.isArray(items)) {
      // Delete existing items and create new ones
      await (prisma as any).imprestItem.deleteMany({
        where: { imprestFundId: params.id }
      })

      updateData.items = {
        create: items.map((item: any) => ({
          tanggal: new Date(item.tanggal),
          uraian: item.uraian,
          glAccountId: item.glAccountId,
          areaPengguna: item.areaPengguna || null,
          jumlah: item.jumlah
        }))
      }
    }

    const imprestFund = await (prisma as any).imprestFund.update({
      where: { id: params.id },
      data: updateData,
      include: {
        items: {
          include: {
            glAccount: true
          }
        },
        imprestFundCard: true
      }
    })

    // If status changed from draft to open, create transactions
    if (currentImprest.status === 'draft' && status === 'open') {
      const currentYear = new Date().getFullYear()
      const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3)

      // Delete existing transactions if any
      await (prisma as any).transaction.deleteMany({
        where: { imprestFundId: params.id }
      })

      // Create new transactions for each item
      for (const item of imprestFund.items) {
        await (prisma as any).transaction.create({
          data: {
            glAccountId: item.glAccountId,
            quarter: currentQuarter,
            regionalCode: (imprestFund as any).regionalCode || 'HO',
            kegiatan: item.uraian,
            regionalPengguna: (item as any).areaPengguna || (imprestFund as any).regionalCode || 'Head Office',
            year: currentYear,
            tanggalKwitansi: item.tanggal,
            nilaiKwitansi: item.jumlah,
            nilaiTanpaPPN: item.jumlah,
            status: 'Open',
            imprestFundId: params.id,
            jenisPengadaan: 'InpresFund',
            // Copy Finance fields
            noTiketMydx: (imprestFund as any).noTiketMydx,
            tglSerahFinance: (imprestFund as any).tglSerahFinance,
            picFinance: (imprestFund as any).picFinance,
            noHpFinance: (imprestFund as any).noHpFinance,
            tglTransferVendor: (imprestFund as any).tglTransferVendor,
            nilaiTransfer: (imprestFund as any).nilaiTransfer,
            // Copy task fields
            taskPengajuan: (imprestFund as any).taskPengajuan,
            taskTransferVendor: (imprestFund as any).taskTransferVendor,
            taskTerimaBerkas: (imprestFund as any).taskTerimaBerkas,
            taskUploadMydx: (imprestFund as any).taskUploadMydx,
            taskSerahFinance: (imprestFund as any).taskSerahFinance,
            taskVendorDibayar: (imprestFund as any).taskVendorDibayar
          } as any
        })
      }
    } else if (status !== 'draft') {
      // Update existing transactions with new status and finance information
      const transactionStatus = status === 'close' ? 'Close' : status === 'proses' ? 'Proses' : 'Open'
      
      await (prisma as any).transaction.updateMany({
        where: { imprestFundId: params.id },
        data: {
          status: transactionStatus,
          // Sync Finance fields from Imprest Fund to Transactions
          noTiketMydx: (imprestFund as any).noTiketMydx,
          tglSerahFinance: (imprestFund as any).tglSerahFinance,
          picFinance: (imprestFund as any).picFinance,
          noHpFinance: (imprestFund as any).noHpFinance,
          tglTransferVendor: (imprestFund as any).tglTransferVendor,
          nilaiTransfer: (imprestFund as any).nilaiTransfer,
          // Update task fields
          taskPengajuan: (imprestFund as any).taskPengajuan,
          taskTransferVendor: (imprestFund as any).taskTransferVendor,
          taskTerimaBerkas: (imprestFund as any).taskTerimaBerkas,
          taskUploadMydx: (imprestFund as any).taskUploadMydx,
          taskSerahFinance: (imprestFund as any).taskSerahFinance,
          taskVendorDibayar: (imprestFund as any).taskVendorDibayar
        }
      })
    }

    // Update Imprest Fund Card saldo based on status changes
    if (imprestFund.imprestFundCardId) {
      const card = await (prisma as any).imprestFundCard.findUnique({
        where: { id: imprestFund.imprestFundCardId }
      })

      if (card) {
        let saldoChange = 0
        
        // When status changes from draft to open: reduce saldo
        if (currentImprest.status === 'draft' && status === 'open') {
          saldoChange = -totalAmount
        }
        
        // When status changes to close: add back nilaiTransfer amount (transfer from finance)
        if (currentImprest.status !== 'close' && status === 'close' && nilaiTransfer) {
          saldoChange = nilaiTransfer
        }
        
        // Update card saldo if there's a change
        if (saldoChange !== 0) {
          await (prisma as any).imprestFundCard.update({
            where: { id: imprestFund.imprestFundCardId },
            data: {
              saldo: card.saldo + saldoChange
            }
          })
        }
      }
    }

    return NextResponse.json(imprestFund)
  } catch (error) {
    console.error('Error updating imprest fund:', error)
    return NextResponse.json({ error: 'Failed to update imprest fund' }, { status: 500 })
  }
}

// DELETE - Delete imprest fund and related transactions
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the imprest fund first to check status and card
    const imprestFund = await (prisma as any).imprestFund.findUnique({
      where: { id: params.id },
      include: { imprestFundCard: true }
    })

    if (!imprestFund) {
      return NextResponse.json({ error: 'Imprest fund not found' }, { status: 404 })
    }

    // If imprest fund has a card and status is not draft, return the saldo
    if (imprestFund.imprestFundCardId && imprestFund.status !== 'draft') {
      // Calculate amount to return: totalAmount minus any nilaiTransfer already received
      const amountToReturn = imprestFund.totalAmount - (imprestFund.nilaiTransfer || 0)
      
      if (amountToReturn > 0) {
        await (prisma as any).imprestFundCard.update({
          where: { id: imprestFund.imprestFundCardId },
          data: {
            saldo: {
              increment: amountToReturn
            }
          }
        })
      }
    }

    // Delete related transactions first (cascade delete)
    await (prisma as any).transaction.deleteMany({
      where: { imprestFundId: params.id }
    })

    // Then delete the imprest fund (items will be deleted automatically due to cascade)
    await (prisma as any).imprestFund.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Imprest fund and related transactions deleted successfully' })
  } catch (error) {
    console.error('Error deleting imprest fund:', error)
    return NextResponse.json({ error: 'Failed to delete imprest fund' }, { status: 500 })
  }
}