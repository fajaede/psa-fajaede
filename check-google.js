const { PrismaClient } = require('@prisma/client');
(async ()=>{
  const p = new PrismaClient();
  try{
    const r = await p.psaScan.findUnique({ where: { url: 'https://google.com' } });
    console.log(JSON.stringify(r, null, 2));
  } catch(e){ console.error(e); }
  finally{ await p.$disconnect(); }
})();
