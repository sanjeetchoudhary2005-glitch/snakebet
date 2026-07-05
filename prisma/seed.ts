import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@Snakebet.local'
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMeAdmin123!'
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'ADMIN',
      isVerified: true,
    },
    create: {
      email: adminEmail,
      username: 'admin',
      password: await bcrypt.hash(adminPassword, 10),
      role: 'ADMIN',
      referralCode: 'ADMIN',
      isVerified: true,
      balance: 0,
    },
  })

  const testUser = await prisma.user.upsert({
    where: { email: 'codexflow0627b@example.com' },
    update: {
      balance: 10000,
      isVerified: true,
    },
    create: {
      email: 'codexflow0627b@example.com',
      username: 'codexflow0627b',
      password: await bcrypt.hash('TestUser123!', 10),
      role: 'USER',
      referralCode: 'CODEXFLOW',
      isVerified: true,
      balance: 10000,
    },
  })

  console.log('Seeded Snakebet defaults:', {
    adminId: admin.id,
    adminEmail: admin.email,
    testUserId: testUser.id,
    testUserBalance: testUser.balance.toString(),
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
