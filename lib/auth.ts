// lib/auth.ts

/**
 * Simple owner‑only guard used by the dashboard route.
 * It reads the OWNER_EMAIL environment variable and compares it
 * with the provided e‑mail (e.g. from a query param or session).
 */
export function isOwner(email: string): boolean {
  const owner = process.env.OWNER_EMAIL?.trim().toLowerCase() ?? '';
  return email.trim().toLowerCase() === owner;
}
