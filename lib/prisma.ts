// lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// DATABASE_URL in .env is: file:./dev.db
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL!,
});

export const prisma = new PrismaClient({ adapter });