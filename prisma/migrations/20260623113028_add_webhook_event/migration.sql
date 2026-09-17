-- CreateTable
CREATE TABLE "PsaScan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "urlHash" TEXT NOT NULL,
    "pageTitle" TEXT,
    "privacyScore" TEXT,
    "privacyNote" TEXT,
    "securityScore" TEXT,
    "securityNote" TEXT,
    "ageScore" TEXT,
    "ageNote" TEXT,
    "hasSchema" BOOLEAN NOT NULL DEFAULT false,
    "hasCookieBanner" BOOLEAN NOT NULL DEFAULT false,
    "email" TEXT,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "expiresAt" DATETIME
);

-- CreateTable
CREATE TABLE "SeoScan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "trustScore" INTEGER NOT NULL,
    "criticalIssues" JSONB NOT NULL DEFAULT [],
    "checks" JSONB NOT NULL DEFAULT [],
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "GeoScan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "trustScore" INTEGER NOT NULL,
    "criticalIssues" JSONB NOT NULL DEFAULT [],
    "checks" JSONB NOT NULL DEFAULT [],
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PremiumOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PsaScan_url_key" ON "PsaScan"("url");

-- CreateIndex
CREATE UNIQUE INDEX "PsaScan_urlHash_key" ON "PsaScan"("urlHash");

-- CreateIndex
CREATE UNIQUE INDEX "SeoScan_url_key" ON "SeoScan"("url");

-- CreateIndex
CREATE UNIQUE INDEX "GeoScan_url_key" ON "GeoScan"("url");
