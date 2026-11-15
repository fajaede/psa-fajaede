import dns from "node:dns/promises";
import { createHmac } from "node:crypto";
import ipaddr from "ipaddr.js";
import { prisma } from "@/lib/prisma";

const WINDOW_SECONDS = 60;
const MAX_REQUESTS_PER_WINDOW = 12;

const BROWSER_HEADERS = {
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9,nl;q=0.8",
  "Cache-Control": "no-cache",
  "Pragma": "no-cache",
  "Upgrade-Insecure-Requests": "1",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
};

function looksLikeCloudflareChallenge(status: number, headers: Headers, body: string): boolean {
  const server = headers.get("server")?.toLowerCase() ?? "";
  const xServer = headers.get("x-server")?.toLowerCase() ?? "";
  const cfHeader = headers.get("cf-mitigated") ?? "";
  const bodyText = body.toLowerCase();
  return status === 403 || status === 503
    ? server.includes("cloudflare") || xServer.includes("cloudflare") || cfHeader === "1" || /cf-challenge|challenge-page|checking your browser|just a moment|cloudflare/i.test(bodyText)
    : false;
}

export class SharedScanRateLimitUnavailableError extends Error {
  constructor() {
    super("Shared scan rate limiter is unavailable.");
    this.name = "SharedScanRateLimitUnavailableError";
  }
}

function isPublicAddress(address: string): boolean {
  try {
    const parsed = ipaddr.parse(address.split("%", 1)[0]);
    if (parsed.kind() === "ipv6") {
      const ipv6Address = parsed as ipaddr.IPv6;
      if (ipv6Address.isIPv4MappedAddress()) {
        return ipv6Address.toIPv4Address().range() === "unicast";
      }
    }
    return parsed.range() === "unicast";
  } catch {
    return false;
  }
}

export async function validatePublicScanUrl(value: string): Promise<string | null> {
  if (typeof value !== "string" || value.length > 2048) return "De URL is ongeldig of te lang.";

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return "Ongeldige URL.";
  }

  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password || (parsed.port && !["80", "443"].includes(parsed.port))) {
    return "Gebruik een publieke http(s)-website zonder gebruikersgegevens of afwijkende poort.";
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname === "metadata.google.internal") {
    return "Lokale en interne adressen kunnen niet worden gescand.";
  }

  try {
    const addresses = ipaddr.isValid(hostname)
      ? [{ address: hostname }]
      : await dns.lookup(hostname, { all: true, verbatim: true });
    if (addresses.length === 0 || addresses.some(({ address }) => !isPublicAddress(address))) {
      return "Lokale en interne adressen kunnen niet worden gescand.";
    }
  } catch {
    return "De website-hostnaam kon niet worden gevonden.";
  }

  return null;
}

export type PublicFetchResult = {
  status: number;
  url: string;
  headers: Headers;
  text: string;
};

export async function fetchPublicResource(
  value: string,
  options: { method?: "GET" | "HEAD"; timeoutMs?: number; maxBytes?: number; allowedDomain?: string } = {},
): Promise<PublicFetchResult> {
  const method = options.method ?? "GET";
  const maxBytes = options.maxBytes ?? 1_500_000;
  const timeoutMs = options.timeoutMs ?? 8_000;
  const allowedDomain = options.allowedDomain?.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  let currentUrl = value;

  for (let redirectCount = 0; redirectCount <= 3; redirectCount++) {
    const validationError = await validatePublicScanUrl(currentUrl);
    if (validationError) throw new Error(validationError);
    if (allowedDomain) {
      const hostname = new URL(currentUrl).hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
      if (hostname !== allowedDomain && !hostname.endsWith(`.${allowedDomain}`)) {
        throw new Error("De redirect valt buiten het aangevraagde domein.");
      }
    }

    const response = await fetch(currentUrl, {
      method,
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        ...BROWSER_HEADERS,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      },
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      await response.body?.cancel();
      if (!location) throw new Error("De website stuurde een ongeldige redirect.");
      if (redirectCount === 3) throw new Error("Te veel redirects.");
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    const declaredLength = Number(response.headers.get("content-length"));
    if (method !== "HEAD" && Number.isFinite(declaredLength) && declaredLength > maxBytes) {
      await response.body?.cancel();
      throw new Error("De pagina is te groot om veilig te scannen.");
    }

    if (method === "HEAD" || !response.body) {
      return { status: response.status, url: currentUrl, headers: response.headers, text: "" };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let bytesRead = 0;
    let text = "";
    try {
      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        bytesRead += chunk.byteLength;
        if (bytesRead > maxBytes) {
          await reader.cancel();
          throw new Error("De pagina is te groot om veilig te scannen.");
        }
        text += decoder.decode(chunk, { stream: true });
      }
      text += decoder.decode();
    } finally {
      reader.releaseLock();
    }

    if (looksLikeCloudflareChallenge(response.status, response.headers, text)) {
      throw new Error("Cloudflare beschermt deze website tegen automatische scans. Gebruik een browser of zet de botbescherming voor de scanner uit.");
    }

    return { status: response.status, url: currentUrl, headers: response.headers, text };
  }

  throw new Error("Te veel redirects.");
}

export async function checkScanRateLimit(request: Request): Promise<number | null> {
  const clientKey = request.headers.get("x-real-ip")?.trim()
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / (WINDOW_SECONDS * 1000)) * WINDOW_SECONDS * 1000);
  const hmacKey = process.env.RATE_LIMIT_HASH_SECRET || process.env.DATABASE_URL;
  if (!hmacKey) throw new SharedScanRateLimitUnavailableError();
  const clientHash = createHmac("sha256", hmacKey).update(clientKey).digest("hex");

  try {
    const rows = await prisma.$queryRaw<Array<{ count: number }>>`
      INSERT INTO "ScanRateLimit" ("clientHash", "bucketStart", "count")
      VALUES (${clientHash}, ${windowStart}, 1)
      ON CONFLICT ("clientHash") DO UPDATE SET
        "count" = CASE
          WHEN "ScanRateLimit"."bucketStart" < EXCLUDED."bucketStart" THEN 1
          ELSE "ScanRateLimit"."count" + 1
        END,
        "bucketStart" = CASE
          WHEN "ScanRateLimit"."bucketStart" < EXCLUDED."bucketStart" THEN EXCLUDED."bucketStart"
          ELSE "ScanRateLimit"."bucketStart"
        END
      RETURNING "count"
    `;

    const count = Number(rows[0]?.count ?? 0);
    if (count > MAX_REQUESTS_PER_WINDOW) {
      return Math.max(1, Math.ceil((windowStart.getTime() + WINDOW_SECONDS * 1000 - now) / 1000));
    }
    return null;
  } catch (error) {
    console.error("Shared scan rate limiter unavailable:", error instanceof Error ? error.name : "UnknownError");
    throw new SharedScanRateLimitUnavailableError();
  }
}