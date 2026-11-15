// HTTP Basic auth for the owner-only pages (/admin, /dashboard).
// Credentials come from ADMIN_USER (default "admin") and ADMIN_PASSWORD (min. 16 chars).
// Uses only Web APIs so it also runs inside proxy.ts.

function constantTimeEqual(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  let diff = left.length ^ right.length;
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return diff === 0;
}

export function isAdminAuthorization(header: string | null): boolean {
  const password = process.env.ADMIN_PASSWORD ?? "";
  const user = process.env.ADMIN_USER?.trim() || "admin";
  if (password.length < 16 || !header?.startsWith("Basic ")) return false;

  let decoded: string;
  try {
    decoded = atob(header.slice(6).trim());
  } catch {
    return false;
  }
  const separator = decoded.indexOf(":");
  if (separator < 0) return false;
  const userOk = constantTimeEqual(decoded.slice(0, separator), user);
  const passwordOk = constantTimeEqual(decoded.slice(separator + 1), password);
  return userOk && passwordOk;
}
