import dns from "node:dns/promises";

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 12;
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function isPrivateIpv4(address: string): boolean {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return false;

  const [first, second] = octets;
  return first === 10 || first === 127 || (first === 169 && second === 254) || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168);
}

function isPrivateAddress(address: string): boolean {
  const normalized = address.toLowerCase().replace(/^\[|\]$/g, "");
  return isPrivateIpv4(normalized) || normalized === "::1" || normalized === "0:0:0:0:0:0:0:1" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80:");
}

export async function validatePublicScanUrl(value: string): Promise<string | null> {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return "Ongeldige URL.";
  }

  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password || (parsed.port && !["80", "443"].includes(parsed.port))) {
    return "Gebruik een publieke http(s)-website zonder gebruikersgegevens of afwijkende poort.";
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname === "metadata.google.internal" || hostname === "169.254.169.254" || isPrivateAddress(hostname)) {
    return "Lokale en interne adressen kunnen niet worden gescand.";
  }

  try {
    const addresses = await dns.lookup(hostname, { all: true });
    if (addresses.some(({ address }) => isPrivateAddress(address))) return "Lokale en interne adressen kunnen niet worden gescand.";
  } catch {
    return "De website-hostnaam kon niet worden gevonden.";
  }

  return null;
}

export function checkScanRateLimit(request: Request): number | null {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientKey = forwardedFor || request.headers.get("x-real-ip") || "unknown";
  const now = Date.now();
  const current = requestCounts.get(clientKey);

  if (!current || current.resetAt <= now) {
    requestCounts.set(clientKey, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }

  if (current.count >= MAX_REQUESTS_PER_WINDOW) return Math.ceil((current.resetAt - now) / 1000);
  current.count += 1;
  return null;
}