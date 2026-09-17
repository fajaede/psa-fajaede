const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Running backfill: set expiresAt = createdAt + 1 year for NULL expiresAt');
  const res = await prisma.$executeRawUnsafe(`UPDATE "PsaScan" SET "expiresAt" = "createdAt" + interval '1 year' WHERE "expiresAt" IS NULL`);
  console.log('Backfill result:', res);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
