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

CREATE TABLE IF NOT EXISTS "PremiumOrder" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL,
  "tier" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL,
  "priceCents" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "PremiumOrder" ADD COLUMN IF NOT EXISTS "scanUrl" TEXT;
ALTER TABLE "PremiumOrder" ADD COLUMN IF NOT EXISTS "scanMode" TEXT;

CREATE TABLE IF NOT EXISTS "WebhookEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "type" TEXT NOT NULL,
  "payload" JSONB NOT NULL
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
