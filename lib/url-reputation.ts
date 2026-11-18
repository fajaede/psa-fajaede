export type UrlReputation = {
  status: "safe" | "unsafe" | "unknown";
  provider: "google-web-risk" | null;
  threatTypes: string[];
  checkedAt: string | null;
  reason: "checked" | "not-configured" | "provider-unavailable";
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const reputationCache = new Map<string, { expiresAt: number; result: UrlReputation }>();
const THREAT_TYPES = ["SOCIAL_ENGINEERING", "MALWARE", "UNWANTED_SOFTWARE"];

function unknown(reason: UrlReputation["reason"]): UrlReputation {
  return {
    status: "unknown",
    provider: null,
    threatTypes: [],
    checkedAt: null,
    reason,
  };
}

export async function checkUrlReputation(url: string): Promise<UrlReputation> {
  const apiKey = process.env.GOOGLE_WEB_RISK_API_KEY?.trim();
  if (!apiKey) return unknown("not-configured");

  const normalizedUrl = new URL(url).toString();
  const cached = reputationCache.get(normalizedUrl);
  if (cached && cached.expiresAt > Date.now()) return cached.result;

  const endpoint = new URL("https://webrisk.googleapis.com/v1/uris:search");
  endpoint.searchParams.set("key", apiKey);
  endpoint.searchParams.set("uri", normalizedUrl);
  for (const threatType of THREAT_TYPES) endpoint.searchParams.append("threatTypes", threatType);

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) {
      // Log Google's reason (e.g. API not enabled, billing, key restriction) without the key.
      const detail = await response.text().catch(() => "");
      console.warn(`Web Risk lookup failed: HTTP ${response.status} ${detail.slice(0, 300)}`);
      return unknown("provider-unavailable");
    }

    const result = await response.json();
    const rawThreatTypes = result?.threat?.threatTypes;
    if (rawThreatTypes !== undefined && (!Array.isArray(rawThreatTypes) || rawThreatTypes.some((item: unknown) => typeof item !== "string"))) {
      return unknown("provider-unavailable");
    }

    const threatTypes: string[] = Array.isArray(rawThreatTypes) ? rawThreatTypes : [];
    const reputation: UrlReputation = {
      status: threatTypes.length > 0 ? "unsafe" : "safe",
      provider: "google-web-risk",
      threatTypes,
      checkedAt: new Date().toISOString(),
      reason: "checked",
    };
    reputationCache.set(normalizedUrl, { expiresAt: Date.now() + CACHE_TTL_MS, result: reputation });
    return reputation;
  } catch {
    return unknown("provider-unavailable");
  }
}
