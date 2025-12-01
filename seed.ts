import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const expiresAt = new Date()
  expiresAt.setFullYear(expiresAt.getFullYear() + 1)

  const rows = [
    {
      url: "https://fajaede.nl",
      urlHash: Buffer.from("https://fajaede.nl").toString("base64url"),
      pageTitle: "Fajaede.nl - PSA Certified",
      privacyScore: "95",
      privacyNote: "Excellent privacy practices",
      securityScore: "92",
      securityNote: "Strong security headers",
      ageScore: "98",
      ageNote: "Age-appropriate content",
      hasSchema: true,
      hasCookieBanner: true,
      expiresAt,
    },
    {
      url: "https://example.com",
      urlHash: Buffer.from("https://example.com").toString("base64url"),
      pageTitle: "Example Domain",
      privacyScore: "P1 / 3",
      privacyNote: "No privacy policy found on the page",
      securityScore: "S2 / 3",
      securityNote: "Uses HTTPS",
      ageScore: "A1 / 3",
      ageNote: "General audience",
      hasSchema: false,
      hasCookieBanner: false,
      expiresAt,
    },
    {
      url: "https://google.com",
      urlHash: Buffer.from("https://google.com").toString("base64url"),
      pageTitle: "Google",
      privacyScore: "P2 / 3",
      privacyNote: "Basic privacy/cookie info detected",
      securityScore: "S2 / 3",
      securityNote: "Strong security",
      ageScore: "A1 / 3",
      ageNote: "General audience",
      hasSchema: true,
      hasCookieBanner: true,
      expiresAt,
    },
  ]

  for (const r of rows) {
    await prisma.psaScan.upsert({
      where: { url: r.url },
      update: r,
      create: r,
    })
  }

  console.log("Seeded PsaScan rows with 1-year expiry.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
