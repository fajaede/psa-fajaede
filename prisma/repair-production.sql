CREATE TABLE IF NOT EXISTS "SeoScan" (
  "id" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "trustScore" INTEGER NOT NULL,
  "criticalIssues" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "checks" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "isPaid" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SeoScan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "GeoScan" (
  "id" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "trustScore" INTEGER NOT NULL,
  "criticalIssues" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "checks" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "isPaid" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GeoScan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SeoScan_url_key" ON "SeoScan"("url");
CREATE UNIQUE INDEX IF NOT EXISTS "GeoScan_url_key" ON "GeoScan"("url");

DO $$
BEGIN
  CREATE TYPE "Tier" AS ENUM ('RE_SCAN', 'RE_SCAN_ADV');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "PremiumOrder" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL,
  "tier" "Tier" NOT NULL,
  "paymentId" TEXT NOT NULL,
  "priceCents" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "PremiumOrder" ADD COLUMN IF NOT EXISTS "scanUrl" TEXT;
ALTER TABLE "PremiumOrder" ADD COLUMN IF NOT EXISTS "scanMode" TEXT;
ALTER TABLE "PremiumOrder" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "PsaScan" ADD COLUMN IF NOT EXISTS "taxDetails" JSONB;
ALTER TABLE "PremiumOrder" ADD COLUMN IF NOT EXISTS "taxDetails" JSONB;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'PremiumOrder' AND column_name = 'tier' AND data_type <> 'USER-DEFINED'
  ) THEN
    ALTER TABLE "PremiumOrder"
      ALTER COLUMN "tier" TYPE "Tier"
      USING "tier"::"Tier";
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "WebhookEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "type" TEXT NOT NULL,
  "payload" JSONB NOT NULL
);

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

CREATE TABLE IF NOT EXISTS "ScanRateLimit" (
  "clientHash" TEXT NOT NULL PRIMARY KEY,
  "bucketStart" TIMESTAMP(3) NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'SeoScan' AND column_name = 'criticalIssues' AND udt_name = 'text'
  ) THEN
    ALTER TABLE "SeoScan"
      ALTER COLUMN "criticalIssues" TYPE JSONB
      USING CASE
        WHEN "criticalIssues" IS NULL OR btrim("criticalIssues") = '' THEN '[]'::jsonb
        ELSE "criticalIssues"::jsonb
      END;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'SeoScan' AND column_name = 'checks' AND udt_name = 'text'
  ) THEN
    ALTER TABLE "SeoScan"
      ALTER COLUMN "checks" TYPE JSONB
      USING CASE
        WHEN "checks" IS NULL OR btrim("checks") = '' THEN '[]'::jsonb
        ELSE "checks"::jsonb
      END;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'GeoScan' AND column_name = 'criticalIssues' AND udt_name = 'text'
  ) THEN
    ALTER TABLE "GeoScan"
      ALTER COLUMN "criticalIssues" TYPE JSONB
      USING CASE
        WHEN "criticalIssues" IS NULL OR btrim("criticalIssues") = '' THEN '[]'::jsonb
        ELSE "criticalIssues"::jsonb
      END;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'GeoScan' AND column_name = 'checks' AND udt_name = 'text'
  ) THEN
    ALTER TABLE "GeoScan"
      ALTER COLUMN "checks" TYPE JSONB
      USING CASE
        WHEN "checks" IS NULL OR btrim("checks") = '' THEN '[]'::jsonb
        ELSE "checks"::jsonb
      END;
  END IF;
END $$;

-- Dashboard accounts, projects and scan history
-- CreateTable
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "LoginToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL,
    "idHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ScanSnapshot" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "LoginToken_tokenHash_key" ON "LoginToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Session_idHash_key" ON "Session"("idHash");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Project_userId_url_key" ON "Project"("userId", "url");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ScanSnapshot_url_kind_createdAt_idx" ON "ScanSnapshot"("url", "kind", "createdAt");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Older databases created criticalIssues as text[]; the app expects JSONB (lossless conversion).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'SeoScan' AND column_name = 'criticalIssues' AND udt_name = '_text'
  ) THEN
    ALTER TABLE "SeoScan" ALTER COLUMN "criticalIssues" TYPE JSONB USING COALESCE(to_jsonb("criticalIssues"), '[]'::jsonb);
    ALTER TABLE "SeoScan" ALTER COLUMN "criticalIssues" SET DEFAULT '[]'::jsonb;
    ALTER TABLE "SeoScan" ALTER COLUMN "criticalIssues" SET NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'GeoScan' AND column_name = 'criticalIssues' AND udt_name = '_text'
  ) THEN
    ALTER TABLE "GeoScan" ALTER COLUMN "criticalIssues" TYPE JSONB USING COALESCE(to_jsonb("criticalIssues"), '[]'::jsonb);
    ALTER TABLE "GeoScan" ALTER COLUMN "criticalIssues" SET DEFAULT '[]'::jsonb;
    ALTER TABLE "GeoScan" ALTER COLUMN "criticalIssues" SET NOT NULL;
  END IF;
END $$;

-- Invoices (one per paid Mollie payment, gapless numbering per series).
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
