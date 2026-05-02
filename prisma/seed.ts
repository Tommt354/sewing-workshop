import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPhone = process.env.ADMIN_PHONE || '+380000000000';
  const adminPin = process.env.ADMIN_PIN || '1234';
  const adminName = process.env.ADMIN_NAME || 'Адмін';

  const pinHash = await bcrypt.hash(adminPin, 10);

  await prisma.user.upsert({
    where: { phone: adminPhone },
    update: {},
    create: {
      phone: adminPhone,
      name: adminName,
      pinHash,
      role: 'ADMIN',
    },
  });

  console.log(`✅ Адмін створений: ${adminPhone} / PIN: ${adminPin}`);
  console.log(`⚠️  Змініть PIN після першого входу!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
