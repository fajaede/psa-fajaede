// Magic-link login and sessions for the dashboard (/app).
// Only SHA-256 hashes of login tokens and session ids are stored in the database.
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const LOGIN_TOKEN_TTL_MS = 15 * 60 * 1000;
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const isProduction = process.env.NODE_ENV === "production";
// __Host- prefix: Secure, path=/, no Domain, so subdomains cannot set or read it.
export const SESSION_COOKIE = isProduction ? "__Host-psa_session" : "psa_session";

export function hashSecret(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function newSecret(): string {
  return randomBytes(32).toString("base64url");
}

export function normalizeEmail(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const email = input.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

/** Creates a one-time login token for an email address and returns the raw token. */
export async function createLoginToken(email: string, now = new Date()): Promise<string> {
  const token = newSecret();
  await prisma.loginToken.create({
    data: { tokenHash: hashSecret(token), email, expiresAt: new Date(now.getTime() + LOGIN_TOKEN_TTL_MS) },
  });
  return token;
}

/**
 * Uses a login token (once) and returns the raw session id of a new session, or
 * null when the token is unknown, already used or expired.
 */
export async function consumeLoginToken(token: string, now = new Date()): Promise<string | null> {
  if (!token || token.length > 200) return null;
  const tokenHash = hashSecret(token);

  // Atomic: only the first request can flip usedAt from null.
  const claimed = await prisma.loginToken.updateMany({
    where: { tokenHash, usedAt: null, expiresAt: { gt: now } },
    data: { usedAt: now },
  });
  if (claimed.count !== 1) return null;

  const login = await prisma.loginToken.findUnique({ where: { tokenHash } });
  if (!login) return null;

  const user = await prisma.user.upsert({
    where: { email: login.email },
    update: {},
    create: { email: login.email },
  });

  const sessionId = newSecret();
  await prisma.session.create({
    data: { idHash: hashSecret(sessionId), userId: user.id, expiresAt: new Date(now.getTime() + SESSION_TTL_MS) },
  });
  return sessionId;
}

export async function setSessionCookie(sessionId: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

/** The logged-in user for this request, or null. Cached per request. */
export const getCurrentUser = cache(async () => {
  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!sessionId || sessionId.length > 200) return null;
  const session = await prisma.session.findUnique({
    where: { idHash: hashSecret(sessionId) },
    include: { user: true },
  });
  if (!session || session.expiresAt <= new Date()) return null;
  return session.user;
});

/** For pages and server actions under /app: the user, or a redirect to /login. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function destroyCurrentSession(): Promise<void> {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    await prisma.session.deleteMany({ where: { idHash: hashSecret(sessionId) } });
  }
  store.delete(SESSION_COOKIE);
}
