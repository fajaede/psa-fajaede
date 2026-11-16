import { prisma } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Deletes data that is no longer needed (run daily from the cron route).
 * Keeps the retention periods stated in the privacy policy (/privacy):
 * - rate-limit counters (hashed IPs/emails/user ids): after 2 days
 * - login tokens: 1 day after they expired
 * - sessions: once expired
 */
export async function purgeExpiredData(now = new Date()) {
  const [rateLimits, loginTokens, sessions] = await Promise.all([
    prisma.scanRateLimit.deleteMany({ where: { bucketStart: { lt: new Date(now.getTime() - 2 * DAY_MS) } } }),
    prisma.loginToken.deleteMany({ where: { expiresAt: { lt: new Date(now.getTime() - DAY_MS) } } }),
    prisma.session.deleteMany({ where: { expiresAt: { lt: now } } }),
  ]);
  return { rateLimits: rateLimits.count, loginTokens: loginTokens.count, sessions: sessions.count };
}
