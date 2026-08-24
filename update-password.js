require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123!', salt);
  await prisma.user.update({
    where: { email: 'recruiter_test_1@testcompany.com' },
    data: { passwordHash }
  });
  console.log('Password updated successfully for recruiter_test_1@testcompany.com!');
}

main().catch(err => console.error(err)).finally(() => prisma.$disconnect());
