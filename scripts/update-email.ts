import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  // Update admin email from kka.com to digiran.com
  const result = await prisma.user.updateMany({
    where: { email: 'admin@kka.com' },
    data: { email: 'admin@digiran.com' }
  })
  console.log(`Updated ${result.count} user(s)`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
