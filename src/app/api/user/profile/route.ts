import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    console.log('GET /api/user/profile - Session:', session?.user?.email)
    
    if (!session?.user?.email) {
      console.log('Unauthorized - no session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, email: true, role: true, avatar: true }
    })

    console.log('User found:', user)
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    return NextResponse.json(user)
  } catch (error: any) {
    console.error('GET user profile error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await req.json()
    const updateData: any = {}

    if (data.name) updateData.name = data.name
    if (data.role) updateData.role = data.role
    if (data.avatar) updateData.avatar = data.avatar
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10)
    }

    // Find current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if email is being changed and if new email already exists
    if (data.email && data.email !== session.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      })
      
      if (existingUser) {
        return NextResponse.json({ error: 'Email sudah digunakan' }, { status: 400 })
      }
      
      updateData.email = data.email
    }

    const user = await prisma.user.update({
      where: { id: currentUser.id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, avatar: true }
    })

    return NextResponse.json(user)
  } catch (error: any) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: error.message || 'Gagal update user' }, { status: 500 })
  }
}
