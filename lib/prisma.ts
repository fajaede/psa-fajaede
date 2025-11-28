// lib/prisma.ts
import PrismaClientPkg from "@prisma/client";

const PrismaClient = (PrismaClientPkg as any).PrismaClient || PrismaClientPkg;

declare global {
  // eslint-disable-next-line no-var
  var prisma: any | undefined;
}

export const prisma = globalThis.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}
