CREATE TABLE IF NOT EXISTS "Sale" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "paymentId" TEXT NOT NULL,
  "mode" TEXT NOT NULL,
  "product" TEXT NOT NULL,
  "email" TEXT,
  "amountCents" INTEGER NOT NULL,
  "taxDetails" JSONB,
  "paidAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "Sale_paymentId_key" ON "Sale"("paymentId");

CREATE TABLE IF NOT EXISTS "AccountingReportRun" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "weekKey" TEXT NOT NULL,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL,
  "sales" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "AccountingReportRun_weekKey_key" ON "AccountingReportRun"("weekKey");
