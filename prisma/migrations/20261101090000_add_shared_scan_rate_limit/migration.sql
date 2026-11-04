CREATE TABLE IF NOT EXISTS "ScanRateLimit" (
    "clientHash" TEXT NOT NULL,
    "bucketStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ScanRateLimit_pkey" PRIMARY KEY ("clientHash")
);