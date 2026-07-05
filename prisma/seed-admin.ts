import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local explicitly since Prisma's built-in loader might not grab it automatically depending on how it's executed
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const plainPassword = process.env.ADMIN_PASSWORD_PLAIN;

  if (!email || !plainPassword) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD_PLAIN in .env.local first');
  }

  // Hash with bcrypt — 12 rounds (strong, never plaintext)
  const passwordHash = await bcrypt.hash(plainPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { 
      role: 'ADMIN', 
      password: passwordHash, // DB uses "password", not "passwordHash" based on schema
      isVerified: true,
      isActive: true 
    },
    create: {
      email,
      password: passwordHash,
      role: 'ADMIN',
      isVerified: true,
      isActive: true,
      balance: 0,
      username: 'Admin',
    },
  });

  console.log(`Admin account ready: ${admin.email} | role: ${admin.role}`);
  console.log('NOW: remove ADMIN_PASSWORD_PLAIN from .env.local');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
