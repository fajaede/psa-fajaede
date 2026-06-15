const { PrismaClient } = require("@prisma/client");
try { const p = new PrismaClient({ url: "file:./dev.db" }); console.log("Success with url"); } catch(e) { console.error("Error url:", e.message); }
try { const p = new PrismaClient({ adapter: null }); console.log("Success with adapter"); } catch(e) { console.error("Error adapter:", e.message); }

