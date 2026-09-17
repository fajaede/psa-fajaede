const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const scans = await prisma.psaScan.findMany();
    console.log('Found ' + scans.length + ' scans:');
    scans.forEach(scan => {
      console.log('- URL: ' + scan.url);
      console.log('  Title: ' + scan.pageTitle);
    });
  } finally {
    await prisma.$disconnect();
  }
})();
