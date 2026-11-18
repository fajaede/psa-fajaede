-- Number of times the customer re-ran the site audit after fixing issues.
ALTER TABLE "PremiumOrder" ADD COLUMN IF NOT EXISTS "auditReruns" INTEGER NOT NULL DEFAULT 0;
