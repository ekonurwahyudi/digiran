import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir, unlink } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

// GET - Fetch files for a cash record
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const files = await (prisma as any).cashFile.findMany({
      where: { cashId: params.id },
      orderBy: { uploadedAt: 'desc' }
    })
    return NextResponse.json(files)
  } catch (error) {
    console.error('Error fetching cash files:', error)
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
  }
}

// POST - Upload file for a cash record
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cash = await (prisma as any).cash.findUnique({ where: { id: params.id } })
    if (!cash) {
      return NextResponse.json({ error: 'Cash record not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'cash', params.id)
    await mkdir(uploadDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}-${sanitizedName}`
    const filePath = path.join(uploadDir, fileName)

    await writeFile(filePath, buffer)

    const cashFile = await (prisma as any).cashFile.create({
      data: {
        cashId: params.id,
        fileName,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        filePath: `/uploads/cash/${params.id}/${fileName}`
      }
    })

    return NextResponse.json(cashFile, { status: 201 })
  } catch (error) {
    console.error('Error uploading cash file:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}

// DELETE - Delete a file
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')

    if (!fileId) {
      return NextResponse.json({ error: 'File ID required' }, { status: 400 })
    }

    const file = await (prisma as any).cashFile.findUnique({ where: { id: fileId } })
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Delete physical file
    try {
      const filePath = path.join(process.cwd(), 'public', file.filePath)
      await unlink(filePath)
    } catch (e) {
      console.error('Error deleting physical file:', e)
    }

    // Delete database record
    await (prisma as any).cashFile.delete({ where: { id: fileId } })

    return NextResponse.json({ message: 'File deleted successfully' })
  } catch (error) {
    console.error('Error deleting cash file:', error)
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
  }
}
