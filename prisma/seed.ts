import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

// Only load dotenv in development
try {
  require('dotenv/config')
} catch (e) {
  // dotenv not available in production, use environment variables directly
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const glAccounts = [
  { code: '51341002', description: 'BODP BBM Genset', keterangan: 'Pembelian BBM CADA' },
  { code: '51341001', description: 'BODP Catu Daya', keterangan: 'Pemeliharaan Catu Daya Lokasi STO & Non-STO (Relokasi, Re-engginering, dan Regrouping)' },
  { code: '51344001', description: 'BODP Alat Perbaikan Instalasi/Perangkat', keterangan: 'Perbaikan Alker Catu Daya IM dan Sertifikasi Kalibrasi' },
  { code: '51506002', description: 'Printing and copy', keterangan: 'Pembayaran Sewa FC dan Lain-lain' },
  { code: '51346003', description: 'O&M office equipment', keterangan: 'Perbaikan Sarana Kerja dan Pembelian Sarker' },
  { code: '51335006', description: 'O&M of fiber optic and submarine cable', keterangan: 'Perbaikan Modul DWDM' },
  { code: '51346002', description: 'BODP PC (Stand Alone) & Printer', keterangan: 'Perbaikan FC, Printer dan Lain-lain' },
  { code: '51512005', description: 'Meeting expenses', keterangan: 'Support meeting expenses' },
  { code: '51351001', description: 'Domestic travelling for O&M', keterangan: 'SPPD Rapat, Rekonsiliasi, Bantek dan Lain-lain' },
  { code: '51501001', description: 'Domestic travelling for general administration', keterangan: 'SPPD Rapat, BC, dan Administrasi Lainnya' },
]

const regionals = [
  { code: 'TREG-1', name: 'Regional 1' },
  { code: 'TREG-2', name: 'Regional 2' },
  { code: 'TREG-3', name: 'Regional 3' },
  { code: 'TREG-4', name: 'Regional 4' },
  { code: 'TREG-5', name: 'Regional 5' },
  { code: 'TREG-6', name: 'Regional 6' },
  { code: 'TREG-7', name: 'Regional 7' },
]

const vendors = [
  { name: 'PT. Telkom Indonesia', alamat: 'Jakarta', pic: 'John Doe', phone: '021-12345678', email: 'contact@telkom.co.id' },
  { name: 'CV. Mitra Teknologi', alamat: 'Bandung', pic: 'Jane Smith', phone: '022-87654321', email: 'info@mitratek.com' },
  { name: 'PT. Solusi Digital', alamat: 'Surabaya', pic: 'Bob Wilson', phone: '031-11223344', email: 'sales@solusidigital.com' },
  { name: 'UD. Berkah Jaya', alamat: 'Yogyakarta', pic: 'Ahmad Rahman', phone: '0274-556677', email: 'berkah@gmail.com' },
  { name: 'PT. Inovasi Mandiri', alamat: 'Medan', pic: 'Siti Nurhaliza', phone: '061-998877', email: 'inovasi@mandiri.co.id' },
]

async function main() {
  console.log('Starting seed...')
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Found' : 'Not found')
  
  // Update old email if exists
  const updateResult = await prisma.user.updateMany({
    where: { email: 'admin@kka.com' },
    data: { email: 'admin@digiran.com' }
  })
  console.log(`Updated ${updateResult.count} user(s) email`)

  // Create admin user if not exists
  const hashedPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@digiran.com' },
    update: {},
    create: {
      email: 'admin@digiran.com',
      password: hashedPassword,
      name: 'Administrator',
      role: 'admin',
    },
  })
  console.log('Admin user ready')

  // Create GL Accounts
  for (const gl of glAccounts) {
    await prisma.glAccount.upsert({
      where: { code: gl.code },
      update: gl,
      create: gl,
    })
  }
  console.log('GL Accounts ready')

  // Create Regionals
  for (const reg of regionals) {
    await prisma.regional.upsert({
      where: { code: reg.code },
      update: reg,
      create: reg,
    })
  }
  console.log('Regionals ready')

  // Create Vendors
  for (const vendor of vendors) {
    const existingVendor = await prisma.vendor.findFirst({
      where: { name: vendor.name }
    })
    
    if (!existingVendor) {
      await prisma.vendor.create({
        data: vendor
      })
    }
  }
  console.log('Vendors ready')

  // Create Budgets and Regional Allocations for 2026
  const currentYear = 2026
  const createdGlAccounts = await prisma.glAccount.findMany()
  const createdRegionals = await prisma.regional.findMany()

  for (const glAccount of createdGlAccounts) {
    // Create budget for each GL Account
    const budget = await prisma.budget.upsert({
      where: {
        glAccountId_year: {
          glAccountId: glAccount.id,
          year: currentYear
        }
      },
      update: {},
      create: {
        glAccountId: glAccount.id,
        year: currentYear,
        rkap: 1000000000, // 1 Billion
        releasePercent: 100,
        totalAmount: 1000000000,
        q1Amount: 250000000, // 250 Million per quarter
        q2Amount: 250000000,
        q3Amount: 250000000,
        q4Amount: 250000000,
      }
    })

    // Create regional allocations for each quarter
    for (let quarter = 1; quarter <= 4; quarter++) {
      const quarterAmount = 250000000 // 250 Million per quarter
      const amountPerRegional = Math.floor(quarterAmount / createdRegionals.length)

      for (const regional of createdRegionals) {
        await prisma.regionalAllocation.upsert({
          where: {
            budgetId_regionalCode_quarter: {
              budgetId: budget.id,
              regionalCode: regional.code,
              quarter: quarter
            }
          },
          update: {},
          create: {
            budgetId: budget.id,
            regionalCode: regional.code,
            quarter: quarter,
            amount: amountPerRegional,
            percentage: (amountPerRegional / quarterAmount) * 100
          }
        })
      }
    }
  }
  console.log('Budgets and Regional Allocations ready')

  console.log('Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
