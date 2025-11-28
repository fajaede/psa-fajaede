import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.psaScan.create({
    data: {
      url: 'https://fajaede.nl',
      urlHash: 'aHR0cHM6Ly9mYWphZWRlLm5s',
      pageTitle: 'Fajaede.nl - PSA Certified',
      privacyScore: '95',
      privacyNote: 'Excellent privacy practices',
      securityScore: '92',
      securityNote: 'Strong security headers',
      ageScore: '98',
      ageNote: 'Age-appropriate content',
      hasSchema: true,
      hasCookieBanner: true,
    }
  })
  console.log('Seeded PsaScan!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
