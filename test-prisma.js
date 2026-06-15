const { PrismaClient } = require("@prisma/client");
try {
  const prisma = new PrismaClient({ log: ["query"] });
  console.log("Success with log");
} catch(e) { console.error("Error with log:", e.message); }
try {
  const prisma2 = new PrismaClient({});
  console.log("Success with empty obj");
} catch(e) { console.error("Error with empty obj:", e.message); }
try {
  const prisma3 = new PrismaClient({ datasources: { db: { url: "file:./dev.db" } } });
  console.log("Success with datasources");
} catch(e) { console.error("Error with datasources:", e.message); }

