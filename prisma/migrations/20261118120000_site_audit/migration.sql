-- Site audit for paid re-scans: audit id at api.fajaede.eu + secret token of the results page.
ALTER TABLE "PremiumOrder" ADD COLUMN IF NOT EXISTS "siteAuditId" TEXT;
ALTER TABLE "PremiumOrder" ADD COLUMN IF NOT EXISTS "auditToken" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "PremiumOrder_auditToken_key" ON "PremiumOrder"("auditToken");
