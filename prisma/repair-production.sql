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
