import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch all imprest fund cards
export async function GET() {
  try {
    const cards = await prisma.imprestFundCard.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(cards)
  } catch (error) {
    console.error('Error fetching imprest fund cards:', error)
    return NextResponse.json({ error: 'Failed to fetch imprest fund cards' }, { status: 500 })
  }
}

// POST - Create new imprest fund card
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nomorKartu, user, saldo, pic } = body

    // Validate required fields
    if (!nomorKartu || !user || !pic) {
      return NextResponse.json(
        { error: 'Nomor Kartu, User, and PIC are required' },
        { status: 400 }
      )
    }

    // Check if nomor kartu already exists
    const existing = await prisma.imprestFundCard.findUnique({
      where: { nomorKartu }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Nomor Kartu already exists' },
        { status: 400 }
      )
    }

    const card = await prisma.imprestFundCard.create({
      data: {
        nomorKartu,
        user,
        saldo: saldo || 0,
        pic
      }
    })

    return NextResponse.json(card, { status: 201 })
  } catch (error) {
    console.error('Error creating imprest fund card:', error)
    return NextResponse.json({ error: 'Failed to create imprest fund card' }, { status: 500 })
  }
}
