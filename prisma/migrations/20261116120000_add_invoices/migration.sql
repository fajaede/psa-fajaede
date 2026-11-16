CREATE TABLE IF NOT EXISTS "Invoice" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "paymentId" TEXT NOT NULL,
  "number" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "seq" INTEGER NOT NULL,
  "mode" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "customerType" TEXT NOT NULL,
  "customerName" TEXT,
  "customerEmail" TEXT,
  "customerAddress" TEXT,
  "customerVat" TEXT,
  "countryCode" TEXT,
  "netCents" INTEGER NOT NULL,
  "vatCents" INTEGER NOT NULL,
  "grossCents" INTEGER NOT NULL,
  "vatRateBasisPoints" INTEGER NOT NULL,
  "reverseCharge" BOOLEAN NOT NULL DEFAULT false,
  "treatment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_paymentId_key" ON "Invoice"("paymentId");
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_number_key" ON "Invoice"("number");
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_year_seq_key" ON "Invoice"("year", "seq");
