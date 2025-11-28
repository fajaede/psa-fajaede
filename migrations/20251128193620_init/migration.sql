-- CreateTable
CREATE TABLE "PsaScan" (
    "id" SERIAL NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PsaScan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PsaScan_url_key" ON "PsaScan"("url");

-- CreateIndex
CREATE UNIQUE INDEX "PsaScan_urlHash_key" ON "PsaScan"("urlHash");
