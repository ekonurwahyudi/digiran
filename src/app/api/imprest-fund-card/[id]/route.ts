import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch single imprest fund card
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const card = await prisma.imprestFundCard.findUnique({
      where: { id: params.id }
    })

    if (!card) {
      return NextResponse.json({ error: 'Imprest fund card not found' }, { status: 404 })
    }

    return NextResponse.json(card)
  } catch (error) {
    console.error('Error fetching imprest fund card:', error)
    return NextResponse.json({ error: 'Failed to fetch imprest fund card' }, { status: 500 })
  }
}

// PUT - Update imprest fund card
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { nomorKartu, user, saldo, pic, isActive } = body

    // Check if nomor kartu already exists (excluding current card)
    if (nomorKartu) {
      const existing = await prisma.imprestFundCard.findFirst({
        where: {
          nomorKartu,
          NOT: { id: params.id }
        }
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Nomor Kartu already exists' },
          { status: 400 }
        )
      }
    }

    const card = await prisma.imprestFundCard.update({
      where: { id: params.id },
      data: {
        ...(nomorKartu && { nomorKartu }),
        ...(user && { user }),
        ...(saldo !== undefined && { saldo }),
        ...(pic && { pic }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return NextResponse.json(card)
  } catch (error) {
    console.error('Error updating imprest fund card:', error)
    return NextResponse.json({ error: 'Failed to update imprest fund card' }, { status: 500 })
  }
}

// DELETE - Delete imprest fund card
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.imprestFundCard.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Imprest fund card deleted successfully' })
  } catch (error) {
    console.error('Error deleting imprest fund card:', error)
    return NextResponse.json({ error: 'Failed to delete imprest fund card' }, { status: 500 })
  }
}
