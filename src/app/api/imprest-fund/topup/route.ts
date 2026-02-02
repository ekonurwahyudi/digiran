import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST - Create top up imprest fund
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imprestFundCardId, debit, keterangan } = body

    if (!imprestFundCardId || !debit || debit <= 0) {
      return NextResponse.json({ error: 'Imprest Fund Card and valid debit amount are required' }, { status: 400 })
    }

    // Get imprest fund card details
    const card = await prisma.imprestFundCard.findUnique({
      where: { id: imprestFundCardId }
    })

    if (!card) {
      return NextResponse.json({ error: 'Imprest Fund Card not found' }, { status: 404 })
    }

    // Create top up imprest fund with status 'close'
    const imprestFund = await prisma.imprestFund.create({
      data: {
        kelompokKegiatan: 'Top Up',
        status: 'close',
        totalAmount: 0,
        debit,
        keterangan: keterangan || `Top Up dari ${card.user} - ${card.nomorKartu}`,
        imprestFundCardId,
        taskPengajuan: true,
        taskTransferVendor: true,
        taskTerimaBerkas: true,
        taskUploadMydx: true,
        taskSerahFinance: true,
        taskVendorDibayar: true
      },
      include: {
        imprestFundCard: true
      }
    })

    // Update card saldo
    await prisma.imprestFundCard.update({
      where: { id: imprestFundCardId },
      data: {
        saldo: card.saldo + debit
      }
    })

    return NextResponse.json(imprestFund)
  } catch (error) {
    console.error('Error creating top up:', error)
    return NextResponse.json({ error: 'Failed to create top up' }, { status: 500 })
  }
}
