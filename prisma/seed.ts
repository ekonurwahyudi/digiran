import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

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

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@kka.com' },
    update: {},
    create: {
      email: 'admin@kka.com',
      password: hashedPassword,
      name: 'Administrator',
      role: 'admin',
    },
  })

  // Create GL Accounts
  for (const gl of glAccounts) {
    await prisma.glAccount.upsert({
      where: { code: gl.code },
      update: gl,
      create: gl,
    })
  }

  // Create Regionals
  for (const reg of regionals) {
    await prisma.regional.upsert({
      where: { code: reg.code },
      update: reg,
      create: reg,
    })
  }

  console.log('Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
