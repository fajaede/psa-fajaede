import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting backfill: set expiresAt = createdAt + 1 year for null values...");

  const rows = await prisma.psaScan.findMany({ where: { expiresAt: null } });
  console.log(`Found ${rows.length} rows needing backfill.`);

  for (const r of rows) {
    const created = new Date(r.createdAt);
    const expires = new Date(created);
    expires.setFullYear(expires.getFullYear() + 1);

    await prisma.psaScan.update({
      where: { id: r.id },
      data: { expiresAt: expires },
    });

    console.log(`Backfilled id=${r.id} url=${r.url} -> expiresAt=${expires.toISOString()}`);
  }

  console.log("Backfill complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
