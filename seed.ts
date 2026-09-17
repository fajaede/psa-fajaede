/// <reference types="node" />
﻿import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

async function main() {
  // Database is nu schoon en klaar voor productie!
  // Geen dummy data meer (zoals fajaede.nl, google.com).
  console.log("Productie gereed. Geen dummy websites toegevoegd.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
